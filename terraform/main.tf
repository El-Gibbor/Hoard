locals {
  subnet_prefixes = {
    bastion = "10.0.1.0/24"
    app     = "10.0.2.0/24"
    db      = "10.0.3.0/24"
  }
}

module "network" {
  source = "./modules/network"

  prefix   = var.prefix
  location = var.location
  tags     = local.tags

  subnets = {
    bastion = {
      address_prefix = local.subnet_prefixes.bastion
      inbound_rules = {
        ssh       = { priority = 100, port = "22", source = var.admin_ip }
        deny-vnet = { priority = 4000, port = "*", source = "VirtualNetwork", access = "Deny" }
      }
    }
    # deny-vnet also covers the host address the load balancer probes from, so lb-probe allows it first.
    app = {
      address_prefix = local.subnet_prefixes.app
      inbound_rules = {
        ssh-from-bastion = { priority = 100, port = "22", source = local.subnet_prefixes.bastion }
        http             = { priority = 110, port = "80", source = "Internet" }
        lb-probe         = { priority = 120, port = "80", source = "AzureLoadBalancer" }
        deny-vnet        = { priority = 4000, port = "*", source = "VirtualNetwork", access = "Deny" }
      }
    }
    db = {
      address_prefix = local.subnet_prefixes.db
      delegation     = "Microsoft.DBforPostgreSQL/flexibleServers"
      inbound_rules = {
        postgres-from-app = { priority = 100, port = "5432", source = local.subnet_prefixes.app }
        within-subnet     = { priority = 110, port = "*", source = local.subnet_prefixes.db }
        deny-vnet         = { priority = 4000, port = "*", source = "VirtualNetwork", access = "Deny" }
      }
    }
  }
}

module "bastion" {
  source = "./modules/compute"

  prefix              = var.prefix
  name                = "bastion"
  public_ip           = true
  location            = module.network.location
  resource_group_name = module.network.resource_group_name
  subnet_id           = module.network.subnet_ids["bastion"]
  vm_size             = var.bastion_vm_size
  admin_username      = var.admin_username
  ssh_public_key      = file(pathexpand(var.ssh_public_key_path))
  tags                = local.tags
}

module "app" {
  source = "./modules/compute"

  prefix              = var.prefix
  name                = "app"
  location            = module.network.location
  resource_group_name = module.network.resource_group_name
  subnet_id           = module.network.subnet_ids["app"]
  vm_size             = var.vm_size
  admin_username      = var.admin_username
  ssh_public_key      = file(pathexpand(var.ssh_public_key_path))
  tags                = local.tags
}

module "loadbalancer" {
  source = "./modules/loadbalancer"

  prefix              = var.prefix
  location            = module.network.location
  resource_group_name = module.network.resource_group_name
  tags                = local.tags

  backend_nics = {
    app = { nic_id = module.app.nic_id, ip_configuration_name = module.app.ip_configuration_name }
  }
}

module "database" {
  source = "./modules/database"

  prefix              = var.prefix
  location            = module.network.location
  resource_group_name = module.network.resource_group_name
  vnet_id             = module.network.vnet_id
  subnet_id           = module.network.subnet_ids["db"]
  sku_name            = var.db_sku_name
  tags                = local.tags
}

module "registry" {
  source = "./modules/registry"

  prefix              = var.prefix
  location            = module.network.location
  resource_group_name = module.network.resource_group_name
  tags                = local.tags
}
