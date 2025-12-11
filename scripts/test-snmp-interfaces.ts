
import { queryDevice } from '../src/lib/snmp-client';

async function test() {
    console.log('Testing interface fetching...');
    // Assuming 10.7.0.1 and public based on logs
    const ip = '10.7.0.1';
    const community = 'public';
    try {
        const metrics = await queryDevice(ip, community, 161, []);
        console.log('Metrics returned:', JSON.stringify(metrics, null, 2));
        if (metrics.interfaces && metrics.interfaces.list && metrics.interfaces.list.length > 0) {
            console.log(`SUCCESS: Found ${metrics.interfaces.list.length} interfaces.`);
        } else {
            console.error('FAILURE: No interfaces found.');
        }
    } catch (error) {
        console.error('ERROR:', error);
    }
}

test();
