variable "prefix" {
  description = "Starts every resource name."
  type        = string
}

variable "location" {
  description = "Azure region for the load balancer."
  type        = string
}

variable "resource_group_name" {
  description = "Resource group to create the load balancer in."
  type        = string
}

variable "backend_nics" {
  description = "Network interfaces that serve the app, keyed by a static name."
  type = map(object({
    nic_id                = string
    ip_configuration_name = string
  }))
}

variable "backend_port" {
  description = "Port the app listens on inside the VM."
  type        = number
  default     = 80
}

variable "probe_path" {
  description = "HTTP path the health probe requests."
  type        = string
  default     = "/healthz"
}

variable "tags" {
  description = "Tags added to every resource."
  type        = map(string)
}
