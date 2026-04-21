/**
 * 匿名ユーザーの識別ヘルパ。
 *
 * Cookie 発行自体は middleware.ts 側で行う。ここでは読み取り専用。
 * Phase 4 以降で認証を導入する場合は、この関数を差し替える。
 */

import { cookies } from 'next/headers';

const COOKIE_NAME = 'anonymous_user_id';

/**
 * 現在のユーザー ID。middleware が必ず事前に発行するため、通常は値がある。
 */
export function getCurrentUserId(): string {
  const value = cookies().get(COOKIE_NAME)?.value;
  if (!value) {
    // middleware が走っていれば到達しないが、念のため明示的に失敗させる
    throw new Error(
      'anonymous_user_id cookie is missing. Is the middleware configured correctly?'
    );
  }
  return value;
}
