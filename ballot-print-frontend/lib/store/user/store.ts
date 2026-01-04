
import { Locale } from "@/dictionaries/dictionaty";
import { User } from "./types"

export const initialUserState: User = {
  id: "",
  uuid: "",
  username: "",
  email: "",
  user_type: 3,
  email_verified: false,
  phone: "",
  phone_verified: false,
  email_verified_at: "",
  created_at: "",
  updated_at: "",
  authenticated: false,
  permissions: []
}

export const defaultLanguage: Locale = "bn"

export const deserialize = (user: { [key: string]: string }): User => {
  return {
    id: user.id,
    uuid: `${user.uuid}`,
    username: user.username,
    user_type: Number(user.user_type),
    email: user.email,
    email_verified: Boolean(user.email_verified),
    phone: user.phone,
    phone_verified: Boolean(user.phone_verified),
    email_verified_at: user.email_verified_at,
    created_at: user.created_at,
    updated_at: user.updated_at,
    authenticated: Boolean(user.authenticated),
    permissions: user.permissions || []
  };
};

export const serialize = (user: User) => {
  return {
    id: user.id,
    uuid: user.uuid,
    username: user.username || "",
    user_type: Number(user.user_type),
    email: user.email || "",
    email_verified: Number(user.email_verified),
    email_verified_at: user.email_verified_at || "",
    phone: user.phone || "",
    phone_verified: Number(user.phone_verified) || "",
    created_at: user.created_at || "",
    updated_at: user.updated_at || "",
    authenticated: Number(user.authenticated),
    permissions: user.permissions || []
  };
};

