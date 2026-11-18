variable "prefix" {
  description = "Starts every resource name."
  type        = string
}

variable "name" {
  description = "Role of the VM, added to its resource names (e.g. app, bastion)."
  type        = string
}

variable "public_ip" {
  description = "Give the VM a static public IP. Only the bastion needs one."
  type        = bool
  default     = false
}

variable "location" {
  description = "Azure region for the VM and its address."
  type        = string
}

variable "resource_group_name" {
  description = "Resource group to create the VM in."
  type        = string
}

variable "subnet_id" {
  description = "Subnet the VM's network interface joins."
  type        = string
}

variable "vm_size" {
  description = "Size of the VM."
  type        = string
}

variable "admin_username" {
  description = "Login user created on the VM."
  type        = string
}

variable "ssh_public_key" {
  description = "Contents of the SSH public key allowed to log in."
  type        = string
}

variable "tags" {
  description = "Tags added to every resource."
  type        = map(string)
}
