output "resource_group_name" {
  description = "Resource group that holds the deployment."
  value       = azurerm_resource_group.this.name
}

output "location" {
  description = "Region of the resource group."
  value       = azurerm_resource_group.this.location
}

output "subnet_id" {
  description = "Subnet the VM attaches to."
  value       = azurerm_subnet.this.id
}

output "nsg_id" {
  description = "Network security group on the subnet."
  value       = azurerm_network_security_group.this.id
}
