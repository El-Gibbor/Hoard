output "public_ip" {
  description = "Static public IP of the VM."
  value       = azurerm_public_ip.this.ip_address
}

output "vm_id" {
  description = "Azure resource ID of the VM."
  value       = azurerm_linux_virtual_machine.this.id
}
