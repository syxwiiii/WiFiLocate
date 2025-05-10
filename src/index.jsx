import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './src/'
import { Map } from '@pbe/react-yandex-maps';
import axios from 'axios';

ReactDOM.createRoot(document.getElementById('root')).render(
	<React.StrictMode>
		<App />
	</React.StrictMode>
);
