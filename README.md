# Introduction

This application enables the setting of currency exchange rates.

# Installation

You may install the latest version of the application from the Serverless Applicaation Repository. It is registered under the name thetis-ims-open-exchange-rates.

## Parameters

When installing the application you must provide values for the following parameters:

- ContextId
- ThetisClientId
- ThetisClientSecret
- ApiKey
- DevOpsEmail

A short explanation for each of these parameters are provided upon installation.

## Initialization

Upon installation the application creates an OpenExchangeRates object in the data document of the context.

# Configuration

In the data document of the context:
```
{
  "OpenExchangeRates": {
    "appId": "7292be887d884b24924b7238bf892601"
  }
}

```

For your convenience the application is initially configured to use our test credentials. 

To get your own credentials you must sign up for a subscription with open exchange rates.

# Events

## Shipment created

When a shipment has been created the application fetches and sets the current exchange rate.

## Inbound shipment created

When an inbound shipment has been created the application fetches and sets the current exchange rate.

## Return shipment created

When a return shipment has been created the application fetches and sets the current exchange rate.
