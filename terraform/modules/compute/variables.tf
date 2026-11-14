variable "prefix" {
  description = "Starts every resource name."
  type        = string
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
