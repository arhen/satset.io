import type { Static } from "elysia";
import { t } from "elysia";

export const CreateUrlRequest = t.Object({
	original_url: t.String(),
	alias: t.Optional(t.String()),
});

export const AliasParams = t.Object({
	alias: t.String(),
});

export const CreateUrlResponse = t.Object({
	alias: t.String(),
	short_url: t.String(),
	original_url: t.String(),
	expires_at: t.Number(),
	created_at: t.Number(),
});

export const CheckAliasResponse = t.Object({
	available: t.Boolean(),
	alias: t.String(),
	reason: t.Optional(t.String()),
});

export const RedirectDataResponse = t.Object({
	original_url: t.String(),
	alias: t.String(),
});

export const ErrorResponse = t.Object({
	error: t.String(),
	message: t.Optional(t.String()),
	retryAfter: t.Optional(t.Number()),
});

export type CreateUrlRequestType = Static<typeof CreateUrlRequest>;
export type CreateUrlResponseType = Static<typeof CreateUrlResponse>;
export type CheckAliasResponseType = Static<typeof CheckAliasResponse>;
export type RedirectDataResponseType = Static<typeof RedirectDataResponse>;
export type ErrorResponseType = Static<typeof ErrorResponse>;
