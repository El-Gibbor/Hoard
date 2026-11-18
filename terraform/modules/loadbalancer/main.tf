resource "azurerm_public_ip" "this" {
  name                = "${var.prefix}-lb-ip"
  resource_group_name = var.resource_group_name
  location            = var.location
  allocation_method   = "Static"
  sku                 = "Standard"
  tags                = var.tags
}

resource "azurerm_lb" "this" {
  name                = "${var.prefix}-lb"
  resource_group_name = var.resource_group_name
  location            = var.location
  sku                 = "Standard"
  tags                = var.tags

  frontend_ip_configuration {
    name                 = "public"
    public_ip_address_id = azurerm_public_ip.this.id
  }
}

resource "azurerm_lb_backend_address_pool" "this" {
  name            = "app"
  loadbalancer_id = azurerm_lb.this.id
}

resource "azurerm_network_interface_backend_address_pool_association" "this" {
  for_each = var.backend_nics

  network_interface_id    = each.value.nic_id
  ip_configuration_name   = each.value.ip_configuration_name
  backend_address_pool_id = azurerm_lb_backend_address_pool.this.id
}

# A VM leaves the pool while nginx stops answering /healthz.
resource "azurerm_lb_probe" "http" {
  name                = "http"
  loadbalancer_id     = azurerm_lb.this.id
  protocol            = "Http"
  port                = var.backend_port
  request_path        = var.probe_path
  interval_in_seconds = 5
  number_of_probes    = 2
}

resource "azurerm_lb_rule" "http" {
  name                           = "http"
  loadbalancer_id                = azurerm_lb.this.id
  protocol                       = "Tcp"
  frontend_port                  = 80
  backend_port                   = var.backend_port
  frontend_ip_configuration_name = "public"
  backend_address_pool_ids       = [azurerm_lb_backend_address_pool.this.id]
  probe_id                       = azurerm_lb_probe.http.id
  disable_outbound_snat          = true
}

# The app VM has no public IP, so it reaches apt and the registry through this rule.
resource "azurerm_lb_outbound_rule" "this" {
  name                     = "outbound"
  loadbalancer_id          = azurerm_lb.this.id
  protocol                 = "All"
  backend_address_pool_id  = azurerm_lb_backend_address_pool.this.id
  allocated_outbound_ports = 1024

  frontend_ip_configuration {
    name = "public"
  }
}
