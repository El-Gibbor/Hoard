output "resource_group_name" {
  description = "Resource group that holds the deployment."
  value       = azurerm_resource_group.this.name
}

output "location" {
  description = "Region of the resource group."
  value       = azurerm_resource_group.this.location
}

output "vnet_id" {
  description = "Virtual network ID, for private DNS links."
  value       = azurerm_virtual_network.this.id
}

output "subnet_ids" {
  description = "Subnet IDs keyed by subnet name."
  value       = { for k, s in azurerm_subnet.this : k => s.id }
}

output "nsg_names" {
  description = "NSG names keyed by subnet name."
  value       = { for k, n in azurerm_network_security_group.this : k => n.name }
}
