const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = "https://kwxxejdmvgvsteairgyp.supabase.co";
const SUPABASE_SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt3eHhlamRtdmd2c3RlYWlyZ3lwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzg3ODcxNDUsImV4cCI6MjA1NDM2MzE0NX0.gdVxilxmw0SwNl-6A9EemvtjSFDd8X0Mzf2K1xJVFXg";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

module.exports = { supabase };