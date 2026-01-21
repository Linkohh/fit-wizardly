/**
 * Circle Feed Tab
 *
 * Activity feed tab content for the Circle Portal.
 * Wraps the existing CircleFeed component with context integration.
 */

import { useCircle } from '../CircleContext';
import { CircleFeed } from '../CircleFeed';

export function CircleFeedTab() {
    const { circle } = useCircle();

    return <CircleFeed circle={circle} />;
}
