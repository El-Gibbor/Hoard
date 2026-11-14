output "public_ip" {
  description = "Static public IP of the VM."
  value       = module.compute.public_ip
}

output "vm_id" {
  description = "Azure resource ID of the VM."
  value       = module.compute.vm_id
}

output "resource_group_name" {
  description = "Resource group that holds this deployment."
  value       = module.network.resource_group_name
}

output "admin_username" {
  description = "SSH user on the VM."
  value       = var.admin_username
}

output "ssh_command" {
  description = "Command that opens a shell on the VM. The private key is the public key path without .pub."
  value       = "ssh -i ${trimsuffix(pathexpand(var.ssh_public_key_path), ".pub")} ${var.admin_username}@${module.compute.public_ip}"
}
