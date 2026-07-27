export const SAMPLE_POWER_AUTOMATE_FLOW = {
  displayName: "Обробка рахунків та сповіщення в Teams",
  id: "sample-flow-12345",
  connections: {
    shared_sharepointonline: {
      displayName: "SharePoint Online",
      apiName: "shared_sharepointonline"
    },
    shared_teams: {
      displayName: "Microsoft Teams",
      apiName: "shared_teams"
    },
    shared_office365: {
      displayName: "Office 365 Outlook",
      apiName: "shared_office365"
    }
  },
  definition: {
    "$schema": "https://schema.management.azure.com/providers/Microsoft.Logic/schemas/2016-06-01/workflowdefinition.json#",
    "contentVersion": "1.0.0.0",
    "triggers": {
      "When_an_item_is_created": {
        "type": "OpenApiConnection",
        "inputs": {
          "host": { "apiId": "/providers/Microsoft.PowerApps/apis/shared_sharepointonline" },
          "parameters": { "table": "Invoices" }
        }
      }
    },
    "actions": {
      "Initialize_InvoiceAmount": {
        "type": "InitializeVariable",
        "inputs": {
          "variables": [{ "name": "InvoiceAmount", "type": "Float", "value": 0 }]
        },
        "runAfter": {}
      },
      "Parse_Invoice_Details": {
        "type": "ParseJson",
        "inputs": {
          "content": "@triggerOutputs()?['body/JSON_Data']",
          "schema": { "type": "object" }
        },
        "runAfter": {
          "Initialize_InvoiceAmount": ["Succeeded"]
        }
      },
      "Check_High_Value_Invoice": {
        "type": "If",
        "expression": "@greater(triggerOutputs()?['body/Amount'], 5000)",
        "runAfter": {
          "Parse_Invoice_Details": ["Succeeded"]
        },
        "actions": {
          "Post_Approval_Message_to_Teams": {
            "type": "OpenApiConnection",
            "inputs": {
              "host": { "apiId": "/providers/Microsoft.PowerApps/apis/shared_teams" },
              "parameters": { "message": "High value invoice require manager review!" }
            },
            "runAfter": {}
          },
          "Send_Email_to_Finance_Manager": {
            "type": "OpenApiConnection",
            "inputs": {
              "host": { "apiId": "/providers/Microsoft.PowerApps/apis/shared_office365" },
              "parameters": { "subject": "Urgent Invoice Review Needed" }
            },
            "runAfter": {
              "Post_Approval_Message_to_Teams": ["Succeeded"]
            }
          }
        },
        "else": {
          "actions": {
            "Auto_Approve_Invoice": {
              "type": "Compose",
              "inputs": "Auto-approved status updated.",
              "runAfter": {}
            }
          }
        }
      },
      "Catch_Flow_Failure": {
        "type": "OpenApiConnection",
        "inputs": {
          "host": { "apiId": "/providers/Microsoft.PowerApps/apis/shared_teams" },
          "parameters": { "message": "Flow execution failed in invoice processing step!" }
        },
        "runAfter": {
          "Check_High_Value_Invoice": ["Failed", "TimedOut"]
        }
      }
    }
  }
};
