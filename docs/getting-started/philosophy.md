# Philosophy

## Purpose

This document defines the values that guide AES documentation and future implementation decisions.

## Principles

AES is vendor agnostic. Core project knowledge must not depend on one AI vendor, model, or agent.

AES is project-owned. Context, memory, and decisions should live in files controlled by the project unless the project explicitly chooses otherwise.

AES is Markdown first. Human-readable Markdown is the default representation for portable knowledge. Structured data should be used only when it provides clear validation or interoperability value.

AES is explicit over hidden. Important instructions, decisions, and constraints should be visible, version-controlled, and reviewable.

AES favors thin adapters. Vendor-specific files should point to or translate the portable core, not become competing sources of truth.

AES preserves human authority. Agents may propose and execute work, but humans own decisions, approvals, and project direction.

AES is Git friendly. Changes should produce understandable diffs and fit normal pull-request review.

AES supports incremental adoption. A repository should be able to adopt one useful part without implementing the full specification.

AES keeps the core minimal. New abstractions need demonstrated use cases.

## Boundaries

These principles guide the documentation foundation. Future implementation choices should be documented in ADRs when they materially affect compatibility, governance, or project structure.

