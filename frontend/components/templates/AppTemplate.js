import { lockScreen } from '../organisms/LockScreen.js';
import { inactivityWarning } from '../organisms/InactivityWarning.js';
import { navbar } from '../organisms/Navbar.js';
import { mainContent } from '../organisms/MainContent.js';
import { modals } from '../organisms/Modals.js';

export const appTemplate = () => [
    lockScreen(),
    inactivityWarning(),
    navbar(),
    mainContent(),
    modals()
].join('\n\n');
