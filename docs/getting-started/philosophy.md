# Philosophy

## Purpose

This document defines the values that guide Pakemin documentation and future implementation decisions.

## Principles

Pakemin is vendor agnostic. Core project knowledge must not depend on one AI vendor, model, or agent.

Pakemin is project-owned. Context, memory, and decisions should live in files controlled by the project unless the project explicitly chooses otherwise.

Pakemin is Markdown first. Human-readable Markdown is the default representation for portable knowledge. Structured data should be used only when it provides clear validation or interoperability value.

Pakemin is explicit over hidden. Important instructions, decisions, and constraints should be visible, version-controlled, and reviewable.

Pakemin favors thin adapters. Vendor-specific files should point to or translate the portable core, not become competing sources of truth.

Pakemin preserves human authority. Agents may propose and execute work, but humans own decisions, approvals, and project direction.

Pakemin is Git friendly. Changes should produce understandable diffs and fit normal pull-request review.

Pakemin supports incremental adoption. A repository should be able to adopt one useful part without implementing the full specification.

Pakemin keeps the core minimal. New abstractions need demonstrated use cases.

## Boundaries

These principles guide the documentation foundation. Future implementation choices should be documented in ADRs when they materially affect compatibility, governance, or project structure.
