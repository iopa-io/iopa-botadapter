# [![IOPA](http://iopa.io/iopa.png)](http://iopa.io)<br>iopa-botadapter

[![NPM](https://img.shields.io/badge/iopa-certified-99cc33.svg?style=flat-square)](http://iopa.io/)
[![NPM](https://img.shields.io/badge/iopa-bot%20framework-F67482.svg?style=flat-square)](http://iopa.io/)

[![NPM](https://nodei.co/npm/iopa-botadapter.png?downloads=true)](https://nodei.co/npm/iopa-botadapter/)

## About

This mono repository contains the IOPA Bot Framework for Microsoft Teams and other Microsoft BotFramework hosted bots

The IOPA adpater is a rewrite of `botbuilder-js`, adapted for cloud edge environments outside of 
Azure, for example Cloudflare Workers or Google Firebase Functions.   It is light weight, and has
few dependencies outside of the security/authorization protocol.  

The actual interactions with the the Microsoft Bot Framework and the object model are entirely generated from the Swagger/ Open AI definitions so can be reasonably expected to be maintained up to date.

The only dependency that a plugin needs is a typescript definition repository only, so no runtime bloat is added to bot logic

## Included Packages

### Core package

-   `iopa-botadapter` - The IOPA plugin and entry point to this capability.  In particular this includes a lightweight adapter and context record extensions to support the Turn Context.   No runtime dependencies and runs in the browser, at the cloud edge, in serverless functions, or in Node.js environment

### Generated API Schema

-   `iopa-botadapter-schema` - Generated openapi (swagger) connectors for microsoft botframework REST API
-   `iopa-botadapter-schema-auth` - Auth helpers for validating microsoft auth tokens, kept in sync with botbuilder-js framework to implement best practice security guidance
-   `iopa-botadapter-schema-teams` - Partially generated Openapi (swagger) connectors for microsoft teams specific API
-   `iopa-botadapter-schema-tokens` - Generated openapi (swagger) connectors for microsoft botframework REST API user tokens
-   `iopa-botadapter-types` - Slimmed down version of the Microsoft botbuilder SDK for isomorphic use in constrained environments without node.js and with frequent stateless invocations (e.g., serverless workers)

### Plugins and Helpers

-   `iopa-botadapter-cards` - Helper factories to create simple text messages, Bot Framework Cards, Teams Legacy cards and modern Adaptive Cards
-   `iopa-botadapter-plugin-typing` - Middleware to turn on and off the typing indicator

## License

MIT

## API Reference Specification

[![IOPA](http://iopa.io/iopa.png)](http://iopa.io)
