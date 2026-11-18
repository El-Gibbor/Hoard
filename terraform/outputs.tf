output "app_url" {
  description = "Public address of Hoard, served by the load balancer."
  value       = "http://${module.loadbalancer.public_ip}"
}

output "load_balancer_ip" {
  description = "Static public IP of the load balancer."
  value       = module.loadbalancer.public_ip
}

output "resource_group_name" {
  description = "Resource group that holds this deployment."
  value       = module.network.resource_group_name
}

output "admin_username" {
  description = "SSH user on both VMs."
  value       = var.admin_username
}

output "bastion_public_ip" {
  description = "Static public IP of the bastion, the only SSH entry point."
  value       = module.bastion.public_ip
}

output "bastion_nsg_name" {
  description = "NSG on the bastion subnet. CD opens SSH in it for its runner during a deploy."
  value       = module.network.nsg_names["bastion"]
}

output "app_private_ip" {
  description = "Private IP of the app VM. It has no public IP."
  value       = module.app.private_ip
}

output "app_vm_id" {
  description = "Azure resource ID of the app VM."
  value       = module.app.vm_id
}

output "ssh_command" {
  description = "Opens a shell on the app VM through the bastion. The private key is the public key path without .pub."
  value       = "ssh -i ${trimsuffix(pathexpand(var.ssh_public_key_path), ".pub")} -J ${var.admin_username}@${module.bastion.public_ip} ${var.admin_username}@${module.app.private_ip}"
}

output "database_host" {
  description = "Private DNS name of the PostgreSQL server. It resolves only inside the VNet."
  value       = module.database.host
}

output "database_name" {
  description = "Database the app uses."
  value       = module.database.database_name
}

output "database_username" {
  description = "PostgreSQL login the app connects as."
  value       = module.database.admin_username
}

output "database_password" {
  description = "PostgreSQL password. Read it with terraform output -raw database_password."
  value       = module.database.admin_password
  sensitive   = true
}

output "acr_name" {
  description = "Container registry name, for az acr login."
  value       = module.registry.name
}

output "acr_login_server" {
  description = "Registry host that image names start with."
  value       = module.registry.login_server
}
