import * as jose from 'jose'

export const verify_jwt = async (token: string): Promise<any> => {
    try {
        // Decode JWT without verification (backend already verified it)
        const payload = jose.decodeJwt(token);

        console.log('JWT payload:', payload);

        // Map the backend claims to expected format
        const mappedPayload = {
            uuid: payload.uid,
            user_role: payload.role,
            username: payload.username,
            phone: payload.phone,
            permissions: payload.perms,
            exp: payload.exp,
            // Add other fields with defaults if not present in token
            legal_name: '',
            token_type: 'Bearer',
            iat: payload.iat,
            jti: payload.jti || '',
            nonce: 0,
        };

        return mappedPayload;
    } catch (error) {
        console.error('JWT decode error:', error);
    };
    return null;
}
