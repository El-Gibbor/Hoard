output "public_ip" {
  description = "Static public IP of the VM, or null when it has none."
  value       = var.public_ip ? azurerm_public_ip.this[0].ip_address : null
}

output "private_ip" {
  description = "Private IP of the VM in its subnet."
  value       = azurerm_network_interface.this.private_ip_address
}

output "vm_id" {
  description = "Azure resource ID of the VM."
  value       = azurerm_linux_virtual_machine.this.id
}

output "nic_id" {
  description = "Network interface ID, for load balancer pools."
  value       = azurerm_network_interface.this.id
}

output "ip_configuration_name" {
  description = "Name of the NIC's IP configuration."
  value       = "primary"
}
