# Roles for the CD pipeline's identity: push images, and open SSH on the bastion for its runner during a deploy.
resource "azurerm_role_assignment" "deployer_acr_push" {
  count = var.deployer_principal_id == null ? 0 : 1

  scope                = module.registry.id
  role_definition_name = "AcrPush"
  principal_id         = var.deployer_principal_id
}

resource "azurerm_role_assignment" "deployer_bastion_nsg" {
  count = var.deployer_principal_id == null ? 0 : 1

  scope                = module.network.nsg_ids["bastion"]
  role_definition_name = "Network Contributor"
  principal_id         = var.deployer_principal_id
}
