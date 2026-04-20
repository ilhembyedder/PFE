# Class Diagram — LeasRecover

**Date:** 2026-03-25
**Author:** Winston (Architect)
**Reflects:** Object-Oriented Implementation of `mcd.md`

This document contains the UML Class Diagram for the LeasRecover platform, mapped to our object-oriented architecture. It correctly surfaces the `@MappedSuperclass` hierarchy (`BaseEntity` and `TenantAwareEntity`) which translates directly into our Java/Hibernate implementation, keeping our domain model DRY and strictly typed.

```mermaid
classDiagram
    %% Base Entities (Mapped Superclasses)
    class BaseEntity {
        <<MappedSuperclass>>
        +UUID v7 id
        +Timestamp created_at
        +Timestamp updated_at
        +String created_by
        +Int version
        +Boolean is_deleted
        +Timestamp deleted_at
    }

    class TenantAwareEntity {
        <<MappedSuperclass>>
        +UUID v7 tenant_id
    }
    
    %% Inheritance Relationships
    BaseEntity <|-- Tenant
    BaseEntity <|-- TenantAwareEntity
    BaseEntity <|-- SuperAdmin

    TenantAwareEntity <|-- TenantConfig
    TenantAwareEntity <|-- User
    TenantAwareEntity <|-- Client
    TenantAwareEntity <|-- Contract
    TenantAwareEntity <|-- Vehicle
    TenantAwareEntity <|-- RecoveryCase
    TenantAwareEntity <|-- Document
    TenantAwareEntity <|-- Note
    TenantAwareEntity <|-- Aivaluation

    %% Domain Entities
    class Tenant {
        <<Entity>>
        +String name
        +String logo_url
        +Int data_retention_months
        +Enum status
    }

    class TenantConfig {
        <<Entity>>
        +Decimal ai_deviation_moderate
        +Decimal ai_deviation_critical
        +Int dormancy_threshold_days
        +JSONB phase_legal_delays
    }

    class SuperAdmin {
        <<Entity>>
        +String email
        +String password_hash
        +String first_name
        +String last_name
        +Enum status
        +Timestamp last_login
    }

    class User {
        <<Entity>>
        +String email
        +String password_hash
        +String first_name
        +String last_name
        +Enum role
        +Enum status
        +Timestamp last_login
    }

    class Client {
        <<Entity>>
        +String full_name_or_company
        +String registration_number
        +String contact_email
        +String contact_phone
        +Text address
    }

    class Contract {
        <<Entity>>
        +String reference_number
        +Timestamp start_date
        +Timestamp end_date
        +Enum status
    }

    class Vehicle {
        <<Entity>>
        +String vin
        +String license_plate
        +String brand
        +String model
        +Int year
    }

    class RecoveryCase {
        <<Entity>>
        +BigInt initial_residual_value_cents
        +String currency_code
        +Enum current_phase
        +Timestamp phase_started_at
        +Timestamp last_action_at
        +Enum status
    }

    class Document {
        <<Entity>>
        +String file_name
        +String file_url
        +Enum phase_uploaded_in
    }

    class Note {
        <<Entity>>
        +Text content
    }

    class Aivaluation {
        <<Entity>>
        +String extracted_brand
        +String extracted_model
        +Int extracted_year
        +Int extracted_mileage
        +String extracted_condition
        +BigInt estimated_market_value_cents
        +String currency_code
        +BigInt deviation_value_cents
        +Decimal deviation_percentage
        +Enum reliability_indicator
        +Enum status
        +Timestamp processed_at
    }

    %% Associations mapped to fields/FKs
    SuperAdmin "1" o-- "*" Tenant : manages
    Tenant "1" *-- "1" TenantConfig : owns
    Tenant "1" *-- "*" User : employs
    Tenant "1" *-- "*" RecoveryCase : holds
    Tenant "1" *-- "*" Client : manages

    User "1" o-- "*" RecoveryCase : assigned to
    User "1" o-- "*" Document : uploads
    User "1" o-- "*" Note : authors

    Client "1" *-- "*" Contract : signs
    Contract "1" *-- "1" Vehicle : concerns
    Contract "1" *-- "*" RecoveryCase : generates

    RecoveryCase "1" *-- "*" Document : contains
    RecoveryCase "1" *-- "*" Note : commented by
    RecoveryCase "1" *-- "*" Aivaluation : evaluated by

    Document "1" o-- "1" Aivaluation : analyzed in
```
