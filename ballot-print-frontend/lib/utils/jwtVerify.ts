import * as jose from 'jose'

const fetchPublicKey = async (): Promise<string> => {
    try {
        // console.log('Fetching public key from SSO backend...', process.env.NEXT_PUBLIC_SSO_BACKEND_API_URL);
        const response = await fetch(`${process.env.NEXT_PUBLIC_SSO_BACKEND_API_URL}/sso/fetch-public-key/`);
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        const data = await response.json();
        // // console.log('Public key fetched:', data.key)
        return data.key;
    } catch (error) {
        console.error('Error fetching public key:', error);
        throw new Error('Failed to fetch public key');
    }
};

const fetchUserNonce = async (token: string): Promise<number> => {
    try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_SSO_BACKEND_API_URL}/sso/fetch-token-nonce/`, {
            method: 'GET',
            headers: {
                Authorization: `Bearer ${token}`,
                Accept: "application/json",
            },
        });
        if (!response.ok) {
            return 0;
        }
        const data = await response.json();
        return data.nonce;
    } catch (error) {
        console.error('Error fetching public key:', error);
        return 0;
    }
};


export const verify_jwt = async (token: string): Promise<any> => {
    try {
        const publicKey = await fetchPublicKey();
        // console.log('Public key:', publicKey);
        // const nonce = await fetchUserNonce(token);
        // console.log('Nonce:', nonce);
        const key = await jose.importSPKI(publicKey, 'RS256');
        const { payload, protectedHeader } = await jose.jwtVerify(token, key);
        // console.log('Payload nonce:', payload.nonce);
        // if (Number(payload.nonce) !== nonce) {
        //     return null;
        // }
        // console.log('JWT payload:', payload);
        return payload;
    } catch (error) {
        return null;
    }
};
