'use client';
import { createClient } from '@supabase/supabase-js';
import jsPDF from 'jspdf';

const SUPABASE_URL = 'https://jwlfkvslqewwdxshqugt.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp3bGZrdnNscWV3d2R4c2hxdWd0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc0Nzg0NzUsImV4cCI6MjEwMzA1NDQ3NX0.eHPQVkTaSvvfsvpMRpAbjiN_BlcII4DYBFuyC_kaeKg';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export default function CarbonTaleApp() {
  const [formData, setFormData] = useState({
    companyName: '',
    electricityKwh: '',
    fuelLiters: '',
    productionTonnes: ''
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [reportData, setReportData] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const calculateEmissions = (electricity, fuel) => {
    const elecEmissions = electricity * 0.73;
    const fuelEmissions = fuel * 2.31;
    return elecEmissions + fuelEmissions;
  };

  const generatePDF = (data) => {
    const doc = new jsPDF();
    
    doc.setFontSize(20);
    doc.text('Carbon Compliance Report', 20, 20);
    
    doc.setFontSize(12);
    doc.text(`Company: ${data.companyName}`, 20, 40);
    doc.text(`Electricity: ${data.electricityKwh} kWh`, 20, 55);
    doc.text(`Fuel: ${data.fuelLiters} Liters`, 20, 70);
    doc.text(`Production: ${data.productionTonnes} Tonnes`, 20, 85);
    
    doc.setFontSize(14);
    doc.setTextColor(255, 0, 0);
    doc.text(`Total Emissions: ${data.emissions.toFixed(2)} tCO2e`, 20, 110);
    
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(10);
    doc.text('Report generated for CBAM compliance assessment', 20, 130);
    doc.text(`Date: ${new Date().toLocaleDateString()}`, 20, 140);
    
    doc.save(`${data.companyName}-emissions-report.pdf`);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.companyName || !formData.electricityKwh || !formData.fuelLiters) {
      setMessage('Please fill all required fields');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      const electricity = parseFloat(formData.electricityKwh);
      const fuel = parseFloat(formData.fuelLiters);
      const emissions = calculateEmissions(electricity, fuel);

      const { data: companyData, error: companyError } = await supabase
        .from('companies')
        .insert([{ company_name: formData.companyName }])
        .select();

      if (companyError) throw companyError;
      if (!companyData || companyData.length === 0) throw new Error('Failed to create company');

      const companyId = companyData[0].id;

      const { error: energyError } = await supabase
        .from('energy_data')
        .insert([{
          company_id: companyId,
          electricity_kwh: electricity,
          fuel_liters: fuel
        }]);

      if (energyError) throw energyError;

      const { error: reportError } = await supabase
        .from('reports')
        .insert([{
          company_id: companyId,
          emissions_tco2e: emissions,
          report_type: 'CBAM',
          report_status: 'GENERATED',
          data_completeness_status: 'COMPLETE',
          disclaimer_text: 'Report generated for carbon compliance assessment'
        }]);

      if (reportError) throw reportError;

      const reportInfo = {
        companyName: formData.companyName,
        electricityKwh: electricity,
        fuelLiters: fuel,
        productionTonnes: formData.productionTonnes || 'N/A',
        emissions: emissions
      };

      setReportData(reportInfo);
      generatePDF(reportInfo);
      setMessage('Report generated and saved
