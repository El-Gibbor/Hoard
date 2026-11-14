# Keeps state created before the module split, so an existing deployment is not rebuilt.
moved {
  from = azurerm_resource_group.rg
  to   = module.network.azurerm_resource_group.this
}

moved {
  from = azurerm_virtual_network.vnet
  to   = module.network.azurerm_virtual_network.this
}

moved {
  from = azurerm_subnet.subnet
  to   = module.network.azurerm_subnet.this
}

moved {
  from = azurerm_network_security_group.nsg
  to   = module.network.azurerm_network_security_group.this
}

moved {
  from = azurerm_subnet_network_security_group_association.subnet
  to   = module.network.azurerm_subnet_network_security_group_association.this
}

moved {
  from = azurerm_public_ip.ip
  to   = module.compute.azurerm_public_ip.this
}

moved {
  from = azurerm_network_interface.nic
  to   = module.compute.azurerm_network_interface.this
}

moved {
  from = azurerm_linux_virtual_machine.vm
  to   = module.compute.azurerm_linux_virtual_machine.this
}
