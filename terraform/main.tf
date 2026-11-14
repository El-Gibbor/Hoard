module "network" {
  source = "./modules/network"

  prefix   = var.prefix
  location = var.location
  tags     = local.tags

  inbound_rules = {
    ssh   = { priority = 100, port = "22", source = var.admin_ip }
    http  = { priority = 110, port = "80", source = "*" }
    https = { priority = 120, port = "443", source = "*" }
  }
}

module "compute" {
  source = "./modules/compute"

  prefix              = var.prefix
  location            = module.network.location
  resource_group_name = module.network.resource_group_name
  subnet_id           = module.network.subnet_id
  vm_size             = var.vm_size
  admin_username      = var.admin_username
  ssh_public_key      = file(pathexpand(var.ssh_public_key_path))
  tags                = local.tags
}
