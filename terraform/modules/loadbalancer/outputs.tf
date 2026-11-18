output "public_ip" {
  description = "Static public IP the app is served on."
  value       = azurerm_public_ip.this.ip_address
}
