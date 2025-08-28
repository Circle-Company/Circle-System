export type StoreNewUserProps = {
    username: string
    password: string
    metadata?: {
        device_id: string
        device_type: string
        device_name: string
        device_token: string
        os_language: string
        os_version: string
        total_device_memory: string
        screen_resolution_width: number
        screen_resolution_height: number
        has_notch: boolean
        unique_id: string
    }
    location_info?: {
        ip_address: string
        mac_address: string
        country: string
        state: string
        city: string
        zone: string
    }
}

export type UsernameAlreadyInUseProps = {
    username: string
}
