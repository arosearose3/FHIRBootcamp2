import express from 'express';
import cors from 'cors';
import axios from 'axios';
import crypto from 'crypto';  
import session from 'express-session';  

const app = express();
const port = 3000;

app.use(cors({
  origin: 'http://localhost:5173', // replace with your frontend URL
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(session({
  secret: 'your-secret-key', // replace with your secret
  resave: false,
  saveUninitialized: true,
  cookie: { 
    secure: false, // set to true if using HTTPS
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 1 day
  }
}));

//const CLIENT_ID = process.env.CLIENT_ID || 'e65e7f28-354f-44a8-a3b1-32aaedacdfdb';
//const REDIRECT_URI = process.env.REDIRECT_URI || 'http://localhost:3000/callback';
const CLIENT_ID = 'e65e7f28-354f-44a8-a3b1-32aaedacdfdb';
//const CLIENT_SECRET = '4f5a5b5d-7f9e-4c6a-9b8d-6d4a5b5c6d5e';
const REDIRECT_URI =  'http://localhost:3000';

const EPIC_FHIR_BASE_URL = 'https://fhir.epic.com/interconnect-fhir-oauth/api/FHIR/R4';
const TOKEN_ENDPOINT = 'https://fhir.epic.com/interconnect-fhir-oauth/oauth2/token'; // Replace with actual token endpoint


const pkceStore = new Map();
function generateCodeVerifier() {
    return crypto.randomBytes(32).toString('base64url');
  }
  
  function generateCodeChallenge(verifier) {
    return crypto.createHash('sha256').update(verifier).digest('base64url');
  }

// exchange code for auth token, store session variables. 
app.use(async (req, res, next) => {
    const { code, state } = req.query;
  
    if (code && state) {
      // This is the authorization code callback
      try {
        const codeVerifier = pkceStore.get(state);
        if (!codeVerifier) {
          return res.status(400).json({ error: 'Invalid state parameter' });
        }
  
        // Clear the stored code verifier
        pkceStore.delete(state);

        const params = new URLSearchParams({
          grant_type: 'authorization_code',
          code: code,
          redirect_uri: REDIRECT_URI,
          code_verifier: codeVerifier,
          client_id: CLIENT_ID
        });
  
      const config = {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
/*         auth: {
          username: CLIENT_ID,
          password: CLIENT_SECRET
        } */
      };
  

        const response = await axios.post(TOKEN_ENDPOINT, params, config);
  
    //    console.log ('in token exchange: response.data:', response.data);
        const { 
          access_token, 
          token_type, 
          expires_in, 
          scope, 
          id_token, 
          patient,
          refresh_token 
        } = response.data;
  

        // Here you would typically store these tokens securely,
        // associate them with the user's session, and use them for subsequent API calls
  
        // For demonstration, we're sending the tokens back to the client
        // In a real app, you'd set a session cookie and redirect to a frontend route
    // Store tokens in the session
    req.session.tokens = {
      access_token,
      token_type,
      expires_in,
      scope,
      id_token,
      patient,
      refresh_token
    };

    req.session.save((err) => {
      if (err) {
        console.error('Error saving session:', err);
        return res.status(500).json({ error: 'Failed to save session' });
      }
    });
   // console.log ('req.session:', req.session);
    // Redirect to the frontend route
    res.redirect('http://localhost:5173/');
      } catch (error) {
        console.error('Error exchanging code for token:', error);
        res.status(500).json({ error: 'Failed to exchange code for token' });
      }
    } else {
      // This is not the authorization code callback, proceed to next middleware
      next();
    }
  });
  
// New endpoint to fetch SMART configuration and construct auth URL
app.post('/api/auth-url', async (req, res) => {
    try {
      const response = await axios.get(`${EPIC_FHIR_BASE_URL}/.well-known/smart-configuration`);
      const { authorization_endpoint } = response.data;
  
      const state = crypto.randomBytes(16).toString('hex');
      const codeVerifier = generateCodeVerifier();
      const codeChallenge = generateCodeChallenge(codeVerifier);
  
      pkceStore.set(state, codeVerifier);

      const authParams = new URLSearchParams({
        response_type: 'code',
        client_id: CLIENT_ID,
        redirect_uri: REDIRECT_URI,
        scope: 'openid fhirUser',
        state: state,
        aud: EPIC_FHIR_BASE_URL,
        code_challenge: codeChallenge,
        code_challenge_method: 'S256'
      });
  
      const authUrl = `${authorization_endpoint}?${authParams.toString()}`;
  
      // Prepare the response object
       res.json({ authUrl, state });

    } catch (error) {
      console.error('Error constructing auth URL:', error);
      res.status(500).json({ error: 'Failed to construct auth URL' });
    }
  });

// New endpoint to fetch SMART configuration
app.get('/api/smart-config', async (req, res) => {
  try {
    const response = await axios.get('https://fhir.epic.com/interconnect-fhir-oauth/api/FHIR/R4/.well-known/smart-configuration');
    const { authorization_endpoint, token_endpoint } = response.data;
    res.json({ authorization_endpoint, token_endpoint });
  } catch (error) {
    console.error('Error fetching SMART configuration:', error);
    res.status(500).json({ error: 'Failed to fetch SMART configuration' });
  }
});

app.get('/auth/check-session', (req, res) => {
//  console.log('In auth/check-session, Session ID:', req.sessionID);
//  console.log('In auth/check-session, Session data:', req.session);
  if (req.session && req.session.tokens && req.session.tokens.access_token) {
    res.json({ active: true });
  } else {
    res.json({ active: false });
  }
});

app.get('/set-session', (req, res) => {
  req.session.testValue = 'Hello, In-Memory Session!';
  res.send('Session value set');
});

// Example route to get a session variable
app.get('/get-session', (req, res) => {
  res.json({ testValue: req.session.testValue });
});

app.post('/auth/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Error destroying session:', err);
      return res.status(500).json({ error: 'Failed to logout' });
    }
    res.json({ message: 'Logged out successfully' });
  });
});


app.get('/api/medications', async (req, res) => {
  if (!req.session || !req.session.tokens || !req.session.tokens.access_token) {
    console.log('No valid session or access token found');
    return res.status(401).json({ error: 'Not authenticated' });
  }

  try {

    console.log('Fetching medications...');
    console.log('path:',`${EPIC_FHIR_BASE_URL}/MedicationStatement?patient=${req.session.tokens.patient}&status=active,completed`);
    const response = await axios.get<Bundle<MedicationRequest>>(`${EPIC_FHIR_BASE_URL}/MedicationRequest/${req.session.tokens.patient}`, {
      headers: {
        'Authorization': `Bearer ${req.session.tokens.access_token}`,
        'Accept': 'application/json'
      },
      params: {
    //    patient: req.session.tokens.patient,
    //    _sort: '-effectiveDateTime',
    //    _count: 100 // Adjust as needed
      }
    });

    const medications = response.data.entry.map(entry => {
      const resource = entry.resource;
      return {
        name: resource.medicationCodeableConcept?.text || 'Unknown Medication',
        dosage: resource.dosage?.[0]?.text || 'Dosage not specified',
        status: resource.status,
        effectiveDateTime: resource.effectiveDateTime || resource.effectivePeriod?.start
      };
    });

    res.json(medications);
  } catch (error) {
    console.error('Error fetching medications:', error.response?.data || error.message);
    console.error('Error status:', error.response?.status);
    console.error('Error headers:', error.response?.headers);
    res.status(error.response?.status || 500).json({
      error: 'Failed to fetch medications',
      details: error.response?.data || error.message
    });
  }
});

// Lab Results Endpoint
app.get('/api/labs', async (req, res) => {
  if (!req.session || !req.session.tokens || !req.session.tokens.access_token) {
    console.log('No valid session or access token found');
    return res.status(401).json({ error: 'Not authenticated' });
  }

  try {
    const response = await axios.get(`${EPIC_FHIR_BASE_URL}/Observation`, {
      headers: {
        'Authorization': `Bearer ${req.session.tokens.access_token}`,
        'Accept': 'application/json'
      },
      params: {
        patient: req.session.tokens.patient,
        category: 'laboratory',
        _sort: '-date',
        _count: 100
      }
    });

    const labResults = response.data.entry.map(entry => {
      const resource = entry.resource;
      return {
        name: resource.code?.text || 'Unknown Test',
        value: resource.valueQuantity ? `${resource.valueQuantity.value} ${resource.valueQuantity.unit}` : 'N/A',
        status: resource.status,
        effectiveDateTime: resource.effectiveDateTime
      };
    });

    res.json(labResults);
  } catch (error) {
    console.error('Error fetching lab results:', error.response?.data || error.message);
    console.error('Error status:', error.response?.status);
    console.error('Error headers:', error.response?.headers);
    res.status(error.response?.status || 500).json({
      error: 'Failed to fetch lab results',
      details: error.response?.data || error.message
    });
  }
});

// Vital Signs Endpoint
app.get('/api/vitals', async (req, res) => {
  if (!req.session || !req.session.tokens || !req.session.tokens.access_token) {
    console.log('No valid session or access token found');
    return res.status(401).json({ error: 'Not authenticated' });
  }

  try {
    const response = await axios.get(`${EPIC_FHIR_BASE_URL}/Observation`, {
      headers: {
        'Authorization': `Bearer ${req.session.tokens.access_token}`,
        'Accept': 'application/json'
      },
      params: {
        patient: req.session.tokens.patient,
        category: 'vital-signs',
        _sort: '-date',
        _count: 100
      }
    });

    const vitalSigns = response.data.entry.map(entry => {
      const resource = entry.resource;
      return {
        name: resource.code?.text || 'Unknown Vital Sign',
        value: resource.valueQuantity ? `${resource.valueQuantity.value} ${resource.valueQuantity.unit}` : 'N/A',
        status: resource.status,
        effectiveDateTime: resource.effectiveDateTime
      };
    });

    res.json(vitalSigns);
  } catch (error) {
    console.error('Error fetching vital signs:', error.response?.data || error.message);
    console.error('Error status:', error.response?.status);
    console.error('Error headers:', error.response?.headers);
    res.status(error.response?.status || 500).json({
      error: 'Failed to fetch vital signs',
      details: error.response?.data || error.message
    });
  }
});

app.get('/api/patient-info', async (req, res) => {
  if (!req.session || !req.session.tokens || !req.session.tokens.access_token) {
    console.log('No valid session or access token found');
    return res.status(401).json({ error: 'Not authenticated' });
  }

  try {
    const response = await axios.get(`${EPIC_FHIR_BASE_URL}/Patient/${req.session.tokens.patient}`, {
      headers: {
        'Authorization': `Bearer ${req.session.tokens.access_token}`,
        'Accept': 'application/json'
      }
    });

    const resource = response.data;
    const patientInfo = {
      name: resource.name && resource.name[0] ? 
        `${resource.name[0].given.join(' ')} ${resource.name[0].family}` : 'Unknown',
      gender: resource.gender || 'Unknown',
      birthDate: resource.birthDate || 'Unknown',
      identifier: resource.identifier ? 
        resource.identifier.map(id => ({
          system: id.system,
          value: id.value
        })) : []
    };

    res.json(patientInfo);
  } catch (error) {
    console.error('Error fetching patient info:', error.response?.data || error.message);
    console.error('Error status:', error.response?.status);
    console.error('Error headers:', error.response?.headers);
    res.status(error.response?.status || 500).json({
      error: 'Failed to fetch patient information',
      details: error.response?.data || error.message
    });
  }
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});