import { getMyConnections } from '@/actions/connection'
import ConnectionList from '@/components/ui/pages/connect/ConnectionList'

export default async function ConnectPage() {
    const result = await getMyConnections();

    // Check for specific error flag indicating subscription is required
    const isLocked = 'error' in result && result.error === 'SUBSCRIPTION_REQUIRED';
    
    // @ts-ignore
    const connections = isLocked ? [] : (result.data || []);

    return (
        <ConnectionList 
            isLocked={isLocked} 
            connections={connections} 
        />
    )
}