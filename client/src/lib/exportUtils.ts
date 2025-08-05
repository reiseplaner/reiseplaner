import jsPDF from 'jspdf';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import type { TripWithDetails } from '@shared/schema';

// Helper function to create Google Maps link
export function createGoogleMapsLink(address: string): string {
  const encodedAddress = encodeURIComponent(address);
  return `https://www.google.com/maps/search/?api=1&query=${encodedAddress}`;
}

// Helper function to create Omio booking link (same as in trip planning)
export function createOmioBookingLink(departure: string, destination: string, startDate: string, endDate: string, travelers: number): string {
  // Use the same simple link as in trip planning
  const affiliateId = '5197603';
  return `https://www.omio.com/flights?partner=${affiliateId}`;
}

// Helper function to export to Google Sheets
export function exportTripToGoogleSheets(trip: TripWithDetails) {
  try {
    // Create structured data for Google Sheets
    const sheetsData = {
      tripInfo: {
        name: trip.name || 'Reiseplan',
        destination: `${trip.departure || 'N/A'} → ${trip.destination || 'N/A'}`,
        dates: trip.startDate && trip.endDate ? 
          `${new Date(trip.startDate).toLocaleDateString('de-DE')} - ${new Date(trip.endDate).toLocaleDateString('de-DE')}` : 'N/A',
        travelers: `${trip.travelers || 1} Personen`,
        budget: trip.totalBudget ? `€${parseFloat(trip.totalBudget).toLocaleString()}` : 'N/A',
        flightBookingLink: trip.departure && trip.destination && trip.startDate && trip.endDate && trip.travelers ? 
          createOmioBookingLink(trip.departure, trip.destination, trip.startDate, trip.endDate, trip.travelers) : ''
      },
      budgetItems: trip.budgetItems.map(item => ({
        category: item.category,
        subcategory: item.subcategory || '',
        quantity: item.quantity || 1,
        unitPrice: parseFloat(item.unitPrice || '0'),
        totalPrice: parseFloat(item.totalPrice || '0'),
        comment: item.comment || '',
        link: item.affiliateLink || ''
      })),
      activities: trip.activities.map(activity => ({
        title: activity.title,
        location: activity.location || '',
        date: activity.date ? new Date(activity.date).toLocaleDateString('de-DE') : '',
        time: activity.timeFrom ? `${activity.timeFrom}${activity.timeTo ? ` - ${activity.timeTo}` : ''}` : '',
        price: activity.price ? `€${parseFloat(activity.price).toLocaleString()}` : 'Kostenlos',
        status: activity.status || 'geplant',
        comment: activity.comment || '',
        bookingLink: activity.bookingLink || (activity.location ? createGoogleMapsLink(activity.location) : ''),
        mapsLink: activity.location ? createGoogleMapsLink(activity.location) : ''
      })),
      restaurants: trip.restaurants.map(restaurant => ({
        name: restaurant.name,
        address: restaurant.address || '',
        cuisine: restaurant.cuisine || '',
        date: restaurant.date ? new Date(restaurant.date).toLocaleDateString('de-DE') : '',
        time: restaurant.timeFrom ? `${restaurant.timeFrom}${restaurant.timeTo ? ` - ${restaurant.timeTo}` : ''}` : '',
        priceRange: restaurant.priceRange || '',
        status: restaurant.status || 'geplant',
        comment: restaurant.comment || '',
        reservationLink: restaurant.reservationLink || '',
        mapsLink: restaurant.address ? createGoogleMapsLink(restaurant.address) : ''
      }))
    };

    // Create Google Sheets URL
    const baseUrl = 'https://docs.google.com/spreadsheets/create';
    const sheetTitle = encodeURIComponent(`${trip.name || 'Reiseplan'} - Travel Overview`);
    
    // Create the sheet structure
    const createSheetsUrl = () => {
      // We'll create a simplified CSV format that Google Sheets can import
      const csvData = [];
      
      // Header
      csvData.push(['REISE ÜBERSICHT - ' + (trip.name || 'Reiseplan')]);
      csvData.push(['']);
      csvData.push(['GRUNDDATEN']);
      csvData.push(['Reisename', trip.name || 'Reiseplan']);
      csvData.push(['Route', `${trip.departure || 'N/A'} → ${trip.destination || 'N/A'}`]);
      csvData.push(['Reisedatum', sheetsData.tripInfo.dates]);
      csvData.push(['Reisende', sheetsData.tripInfo.travelers]);
      csvData.push(['Budget', sheetsData.tripInfo.budget]);
      csvData.push(['Flug buchen', sheetsData.tripInfo.flightBookingLink]);
      csvData.push(['']);
      
      // Budget
      if (trip.budgetItems.length > 0) {
        csvData.push(['BUDGET ÜBERSICHT']);
        csvData.push(['Kategorie', 'Unterkategorie', 'Menge', 'Einzelpreis', 'Gesamtpreis', 'Kommentar', 'Link']);
        sheetsData.budgetItems.forEach(item => {
          csvData.push([
            item.category,
            item.subcategory,
            item.quantity,
            `€${item.unitPrice.toLocaleString()}`,
            `€${item.totalPrice.toLocaleString()}`,
            item.comment,
            item.link
          ]);
        });
        csvData.push(['']);
      }
      
      // Activities
      if (trip.activities.length > 0) {
        csvData.push(['AKTIVITÄTEN']);
        csvData.push(['Titel', 'Ort', 'Datum', 'Zeit', 'Preis', 'Status', 'Kommentar', 'Buchungslink', 'Google Maps']);
        sheetsData.activities.forEach(activity => {
          csvData.push([
            activity.title,
            activity.location,
            activity.date,
            activity.time,
            activity.price,
            activity.status,
            activity.comment,
            activity.bookingLink,
            activity.mapsLink
          ]);
        });
        csvData.push(['']);
      }
      
      // Restaurants
      if (trip.restaurants.length > 0) {
        csvData.push(['RESTAURANTS']);
        csvData.push(['Name', 'Adresse', 'Küche', 'Datum', 'Zeit', 'Preisklasse', 'Status', 'Kommentar', 'Reservierung', 'Google Maps']);
        sheetsData.restaurants.forEach(restaurant => {
          csvData.push([
            restaurant.name,
            restaurant.address,
            restaurant.cuisine,
            restaurant.date,
            restaurant.time,
            restaurant.priceRange,
            restaurant.status,
            restaurant.comment,
            restaurant.reservationLink,
            restaurant.mapsLink
          ]);
        });
      }
      
      return csvData;
    };

    const csvData = createSheetsUrl();
    
    // Convert to CSV string
    const csvString = csvData.map(row => 
      row.map(cell => `"${(cell || '').toString().replace(/"/g, '""')}"`).join(',')
    ).join('\n');
    
    // Create blob and download
    const blob = new Blob(['\uFEFF' + csvString], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    // Create download link
    const link = document.createElement('a');
    link.href = url;
    link.download = `${trip.name || 'Reiseplan'}_GoogleSheets.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    // Show instructions to user
    setTimeout(() => {
      alert(`CSV-Datei für Google Sheets erstellt!

Anleitung:
1. Gehen Sie zu https://sheets.google.com
2. Klicken Sie auf "+" um ein neues Sheet zu erstellen
3. Gehen Sie zu "Datei" → "Importieren"
4. Laden Sie die heruntergeladene CSV-Datei hoch
5. Wählen Sie "Komma" als Trennzeichen
6. Klicken Sie auf "Daten importieren"

Ihre Reisedaten sind jetzt in Google Sheets verfügbar und können geteilt werden!`);
    }, 1000);

  } catch (error) {
    console.error('Error creating Google Sheets export:', error);
    throw new Error('Fehler beim Erstellen des Google Sheets Exports');
  }
}

export function exportTripToPDF(trip: TripWithDetails) {
  const pdf = new jsPDF();
  let yPosition = 20;
  const lineHeight = 6;
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 20;
  const contentWidth = pageWidth - 2 * margin;

  // Simple color scheme
  const headerGray = [128, 128, 128]; // Gray for headers
  const lightGray = [240, 240, 240]; // Light gray for backgrounds
  const textBlack = [0, 0, 0];
  const linkBlue = [0, 102, 204];

  // Helper function to add gray header background
  const addHeaderBg = (x: number, y: number, width: number, height: number) => {
    pdf.setFillColor(lightGray[0], lightGray[1], lightGray[2]);
    pdf.rect(x, y, width, height, 'F');
  };

  // Helper function to add text with line breaks
  const addText = (text: string, x: number, y: number, maxWidth?: number) => {
    const width = maxWidth || contentWidth;
    const lines = pdf.splitTextToSize(text, width);
    pdf.text(lines, x, y);
    return y + (lines.length * lineHeight);
  };

  // Helper function to add centered text
  const addCenteredText = (text: string, y: number, maxWidth?: number) => {
    const width = maxWidth || contentWidth;
    const lines = pdf.splitTextToSize(text, width);
    lines.forEach((line: string, index: number) => {
      const textWidth = pdf.getTextWidth(line);
      const x = (pageWidth - textWidth) / 2;
      pdf.text(line, x, y + (index * lineHeight));
    });
    return y + (lines.length * lineHeight);
  };

  // Helper function to add clickable link
  const addLink = (text: string, url: string, x: number, y: number) => {
    pdf.setTextColor(linkBlue[0], linkBlue[1], linkBlue[2]);
    pdf.text(text, x, y);
    const textWidth = pdf.getTextWidth(text);
    pdf.link(x, y - 3, textWidth, 6, { url: url });
    pdf.setTextColor(textBlack[0], textBlack[1], textBlack[2]);
    return y + lineHeight;
  };

  // Helper function to check if we need a new page
  const checkNewPage = (requiredSpace: number) => {
    if (yPosition + requiredSpace > pageHeight - margin) {
      pdf.addPage();
      yPosition = margin;
    }
  };

  // Helper function to add section header with gray styling
  const addSectionHeader = (title: string) => {
    checkNewPage(25);
    addHeaderBg(margin, yPosition - 3, contentWidth, 15);
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(headerGray[0], headerGray[1], headerGray[2]);
    yPosition = addCenteredText(title, yPosition + 9);
    pdf.setTextColor(textBlack[0], textBlack[1], textBlack[2]);
    pdf.setFont('helvetica', 'normal');
    yPosition += 10;
  };

  // Helper function to add separator line
  const addSeparatorLine = () => {
    pdf.setDrawColor(lightGray[0], lightGray[1], lightGray[2]);
    pdf.line(margin, yPosition, margin + contentWidth, yPosition);
    yPosition += 8;
  };

  try {
    // Title
    pdf.setFontSize(22);
    pdf.setFont('helvetica', 'bold');
    yPosition = addCenteredText('REISEPLAN', yPosition);
    yPosition += 8;

    // Trip name
    pdf.setFontSize(18);
    pdf.setFont('helvetica', 'bold');
    yPosition = addCenteredText(trip.name || 'Unbenannte Reise', yPosition);
    yPosition += 15;

    addSeparatorLine();

    // Basic trip information
    addSectionHeader('REISEDATEN');
    pdf.setFontSize(11);

    if (trip.startDate && trip.endDate) {
      const startDate = new Date(trip.startDate).toLocaleDateString('de-DE');
      const endDate = new Date(trip.endDate).toLocaleDateString('de-DE');
      pdf.setFont('helvetica', 'bold');
      pdf.text('Reisezeitraum:', margin, yPosition);
      pdf.setFont('helvetica', 'normal');
      yPosition = addText(`${startDate} bis ${endDate}`, margin + 40, yPosition);
      yPosition += 2;
    }

    if (trip.departure && trip.destination) {
      pdf.setFont('helvetica', 'bold');
      pdf.text('Route:', margin, yPosition);
      pdf.setFont('helvetica', 'normal');
      yPosition = addText(`${trip.departure} → ${trip.destination}`, margin + 40, yPosition);
      yPosition += 2;
    }

    if (trip.travelers) {
      pdf.setFont('helvetica', 'bold');
      pdf.text('Reisende:', margin, yPosition);
      pdf.setFont('helvetica', 'normal');
      yPosition = addText(`${trip.travelers} Person(en)`, margin + 40, yPosition);
      yPosition += 2;
    }

    if (trip.totalBudget) {
      pdf.setFont('helvetica', 'bold');
      pdf.text('Budget:', margin, yPosition);
      pdf.setFont('helvetica', 'normal');
      yPosition = addText(`€${parseFloat(trip.totalBudget).toLocaleString('de-DE')}`, margin + 40, yPosition);
      yPosition += 2;
    }

    yPosition += 8;

    // Flight booking link
    if (trip.departure && trip.destination) {
      const bookingLink = createOmioBookingLink(trip.departure, trip.destination, trip.startDate || '', trip.endDate || '', trip.travelers || 1);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Flugbuchung:', margin, yPosition);
      pdf.setFont('helvetica', 'normal');
      yPosition = addLink('Bei Omio buchen', bookingLink, margin + 40, yPosition);
      yPosition += 5;
    }

    addSeparatorLine();

    // Budget breakdown
    if (trip.budgetItems && trip.budgetItems.length > 0) {
      addSectionHeader('BUDGET AUFSCHLÜSSELUNG');
      
      let totalExpenses = 0;
      
      trip.budgetItems.forEach((item, index) => {
        checkNewPage(30);
        
        const itemTotal = parseFloat(item.totalPrice || '0');
        totalExpenses += itemTotal;
        
        // Category header
        pdf.setFontSize(11);
        pdf.setFont('helvetica', 'bold');
        yPosition = addText(`${index + 1}. ${item.category}${item.subcategory ? ` - ${item.subcategory}` : ''}`, margin, yPosition);
        
        // Item details
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(10);
        const quantity = item.quantity || 1;
        const unitPrice = parseFloat(item.unitPrice || '0');
        yPosition = addText(`Menge: ${quantity} × €${unitPrice.toLocaleString('de-DE')} = €${itemTotal.toLocaleString('de-DE')}`, margin + 10, yPosition);
        
        if (item.comment) {
          yPosition = addText(`Kommentar: ${item.comment}`, margin + 10, yPosition);
        }
        
        if (item.affiliateLink) {
          yPosition = addLink('→ Zum Angebot', item.affiliateLink, margin + 10, yPosition);
        }
        
        yPosition += 8;
      });

      // Budget summary box
      addHeaderBg(margin, yPosition - 3, contentWidth, 25);
      yPosition += 5;
      
      pdf.setFontSize(11);
      pdf.setFont('helvetica', 'bold');
      yPosition = addText(`Gesamtausgaben: €${totalExpenses.toLocaleString('de-DE')}`, margin + 10, yPosition);
      
      if (trip.totalBudget) {
        const budget = parseFloat(trip.totalBudget);
        const remaining = budget - totalExpenses;
        
        if (remaining >= 0) {
          yPosition = addText(`Verbleibendes Budget: €${remaining.toLocaleString('de-DE')}`, margin + 10, yPosition);
        } else {
          yPosition = addText(`Budgetüberschreitung: €${Math.abs(remaining).toLocaleString('de-DE')}`, margin + 10, yPosition);
        }
      }
      
      pdf.setFont('helvetica', 'normal');
      yPosition += 10;
      addSeparatorLine();
    }

    // Activities
    if (trip.activities && trip.activities.length > 0) {
      addSectionHeader('AKTIVITÄTEN UND SEHENSWÜRDIGKEITEN');
      
      trip.activities.forEach((activity, index) => {
        checkNewPage(40);
        
        // Activity header
        pdf.setFontSize(11);
        pdf.setFont('helvetica', 'bold');
        yPosition = addText(`${index + 1}. ${activity.title}`, margin, yPosition);
        
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(10);
        
        if (activity.location) {
          pdf.text('Ort:', margin + 10, yPosition);
          yPosition = addText(activity.location, margin + 30, yPosition);
          yPosition = addLink('→ Google Maps', createGoogleMapsLink(activity.location), margin + 10, yPosition);
        }
        
        if (activity.date) {
          const dateStr = new Date(activity.date).toLocaleDateString('de-DE');
          let timeStr = '';
          if (activity.timeFrom) {
            timeStr = ` um ${activity.timeFrom}`;
            if (activity.timeTo) {
              timeStr += ` bis ${activity.timeTo}`;
            }
          }
          pdf.text('Datum:', margin + 10, yPosition);
          yPosition = addText(`${dateStr}${timeStr}`, margin + 30, yPosition);
        }
        
        if (activity.price) {
          pdf.text('Preis:', margin + 10, yPosition);
          yPosition = addText(`€${parseFloat(activity.price).toLocaleString('de-DE')} pro Person`, margin + 30, yPosition);
        }
        
        if (activity.comment) {
          pdf.text('Beschreibung:', margin + 10, yPosition);
          yPosition = addText(activity.comment, margin + 30, yPosition, contentWidth - 30);
        }
        
        if (activity.bookingLink) {
          yPosition = addLink('→ Jetzt buchen', activity.bookingLink, margin + 10, yPosition);
        }
        
        yPosition += 10;
      });
      
      addSeparatorLine();
    }

    // Restaurants
    if (trip.restaurants && trip.restaurants.length > 0) {
      addSectionHeader('RESTAURANTS UND GASTRONOMIE');
      
      trip.restaurants.forEach((restaurant, index) => {
        checkNewPage(40);
        
        // Restaurant header
        pdf.setFontSize(11);
        pdf.setFont('helvetica', 'bold');
        yPosition = addText(`${index + 1}. ${restaurant.name}`, margin, yPosition);
        
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(10);
        
        if (restaurant.address) {
          pdf.text('Adresse:', margin + 10, yPosition);
          yPosition = addText(restaurant.address, margin + 30, yPosition, contentWidth - 30);
          yPosition = addLink('→ Google Maps', createGoogleMapsLink(restaurant.address), margin + 10, yPosition);
        }
        
        if (restaurant.cuisine) {
          pdf.text('Küche:', margin + 10, yPosition);
          yPosition = addText(restaurant.cuisine, margin + 30, yPosition);
        }
        
        if (restaurant.date) {
          const dateStr = new Date(restaurant.date).toLocaleDateString('de-DE');
          let timeStr = '';
          if (restaurant.timeFrom) {
            timeStr = ` um ${restaurant.timeFrom}`;
            if (restaurant.timeTo) {
              timeStr += ` bis ${restaurant.timeTo}`;
            }
          }
          pdf.text('Datum:', margin + 10, yPosition);
          yPosition = addText(`${dateStr}${timeStr}`, margin + 30, yPosition);
        }
        
        if (restaurant.priceRange) {
          pdf.text('Preisklasse:', margin + 10, yPosition);
          yPosition = addText(restaurant.priceRange, margin + 30, yPosition);
        }
        
        if (restaurant.comment) {
          pdf.text('Notizen:', margin + 10, yPosition);
          yPosition = addText(restaurant.comment, margin + 30, yPosition, contentWidth - 30);
        }
        
        if (restaurant.reservationLink) {
          yPosition = addLink('→ Reservierung', restaurant.reservationLink, margin + 10, yPosition);
        }
        
        yPosition += 10;
      });
    }

    // Footer
    const totalPages = pdf.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      pdf.setPage(i);
      pdf.setFontSize(8);
      pdf.setTextColor(128, 128, 128);
      const footerText = `${trip.name || 'Reiseplan'} - Seite ${i} von ${totalPages} - Erstellt am ${new Date().toLocaleDateString('de-DE')}`;
      const footerX = (pageWidth - pdf.getTextWidth(footerText)) / 2;
      pdf.text(footerText, footerX, pageHeight - 10);
    }

    // Save the PDF
    const fileName = `${trip.name || 'Reiseplan'}_Übersicht.pdf`;
    pdf.save(fileName);

  } catch (error) {
    console.error('Error generating PDF:', error);
    throw new Error('Fehler beim Erstellen der PDF-Datei');
  }
}

export function exportTripToCSV(trip: TripWithDetails) {
  try {
    const csvData: any[] = [];

    // Trip information header
    csvData.push({
      Typ: '=== REISE ÜBERSICHT ===',
      Name: trip.name || 'Reiseplan',
      Kategorie: 'INFORMATION',
      Datum: trip.startDate ? new Date(trip.startDate).toLocaleDateString('de-DE') : '',
      Zeit: trip.endDate ? `bis ${new Date(trip.endDate).toLocaleDateString('de-DE')}` : '',
      Ort: `${trip.departure || 'N/A'} → ${trip.destination || 'N/A'}`,
      Preis: trip.totalBudget ? `€${parseFloat(trip.totalBudget).toLocaleString()}` : '',
      Status: `${trip.travelers || 1} Personen`,
      Kommentar: `Reiseplanung erstellt am ${new Date().toLocaleDateString('de-DE')}`,
      Link: trip.departure && trip.destination && trip.startDate && trip.endDate && trip.travelers ? 
        createOmioBookingLink(trip.departure, trip.destination, trip.startDate, trip.endDate, trip.travelers) : ''
    });

    // Empty separator row
    csvData.push({
      Typ: '', Name: '', Kategorie: '', Datum: '', Zeit: '', Ort: '', 
      Preis: '', Status: '', Kommentar: '', Link: ''
    });

    // Budget section header
    if (trip.budgetItems.length > 0) {
      csvData.push({
        Typ: '=== BUDGET ÜBERSICHT ===',
        Name: 'Ausgaben-Kategorien',
        Kategorie: 'BUDGET',
        Datum: '', Zeit: '', Ort: '',
        Preis: `Gesamt: €${trip.budgetItems.reduce((sum, item) => sum + parseFloat(item.totalPrice || '0'), 0).toLocaleString()}`,
        Status: 'Geplant', Kommentar: '', Link: ''
      });

      // Budget items with enhanced formatting
      trip.budgetItems.forEach((item) => {
        csvData.push({
          Typ: 'Budget-Position',
          Name: item.subcategory || item.category,
          Kategorie: item.category,
          Datum: '',
          Zeit: '',
          Ort: '',
          Preis: `${item.quantity || 1}x €${parseFloat(item.unitPrice || '0').toLocaleString()} = €${parseFloat(item.totalPrice || '0').toLocaleString()}`,
          Status: 'Geplant',
          Kommentar: item.comment || '',
          Link: item.affiliateLink || ''
        });
      });

      // Empty separator row
      csvData.push({
        Typ: '', Name: '', Kategorie: '', Datum: '', Zeit: '', Ort: '', 
        Preis: '', Status: '', Kommentar: '', Link: ''
      });
    }

    // Activities section
    if (trip.activities.length > 0) {
      csvData.push({
        Typ: '=== AKTIVITÄTEN ===',
        Name: 'Sehenswürdigkeiten & Erlebnisse',
        Kategorie: 'AKTIVITÄTEN',
        Datum: '', Zeit: '', Ort: '',
        Preis: `${trip.activities.length} Aktivitäten geplant`,
        Status: 'Übersicht', Kommentar: '', Link: ''
      });

      trip.activities.forEach((activity) => {
        let timeStr = '';
        if (activity.timeFrom) {
          timeStr = activity.timeFrom;
          if (activity.timeTo) {
            timeStr += ` - ${activity.timeTo}`;
          }
        }
        
        csvData.push({
          Typ: '🎯 Aktivität',
          Name: activity.title,
          Kategorie: 'Sehenswürdigkeit',
          Datum: activity.date ? new Date(activity.date).toLocaleDateString('de-DE') : '',
          Zeit: timeStr,
          Ort: activity.location || '',
          Preis: activity.price ? `€${parseFloat(activity.price).toLocaleString()} p.P.` : 'Kostenlos',
          Status: activity.status || 'geplant',
          Kommentar: activity.comment || '',
          Link: activity.bookingLink || (activity.location ? createGoogleMapsLink(activity.location) : '')
        });
      });

      // Empty separator row
      csvData.push({
        Typ: '', Name: '', Kategorie: '', Datum: '', Zeit: '', Ort: '', 
        Preis: '', Status: '', Kommentar: '', Link: ''
      });
    }

    // Restaurants section
    if (trip.restaurants.length > 0) {
      csvData.push({
        Typ: '=== RESTAURANTS ===',
        Name: 'Gastronomie & Kulinarik',
        Kategorie: 'RESTAURANTS',
        Datum: '', Zeit: '', Ort: '',
        Preis: `${trip.restaurants.length} Restaurants ausgewählt`,
        Status: 'Übersicht', Kommentar: '', Link: ''
      });

      trip.restaurants.forEach((restaurant) => {
        let timeStr = '';
        if (restaurant.timeFrom) {
          timeStr = restaurant.timeFrom;
          if (restaurant.timeTo) {
            timeStr += ` - ${restaurant.timeTo}`;
          }
        }
        
        csvData.push({
          Typ: '🍽️ Restaurant',
          Name: restaurant.name,
          Kategorie: restaurant.cuisine || 'Restaurant',
          Datum: restaurant.date ? new Date(restaurant.date).toLocaleDateString('de-DE') : '',
          Zeit: timeStr,
          Ort: restaurant.address || '',
          Preis: restaurant.priceRange || 'Nicht angegeben',
          Status: restaurant.status || 'geplant',
          Kommentar: restaurant.comment || '',
          Link: restaurant.reservationLink || (restaurant.address ? createGoogleMapsLink(restaurant.address) : '')
        });
      });
    }

    // Convert to CSV with proper formatting
    const csv = Papa.unparse(csvData, {
      delimiter: ';', // Use semicolon for German Excel compatibility
      header: true,
      quotes: true
    });

    // Add BOM for proper UTF-8 encoding in Excel
    const csvWithBOM = '\uFEFF' + csv;

    // Create and download file
    const blob = new Blob([csvWithBOM], { type: 'text/csv;charset=utf-8;' });
    const fileName = `${trip.name || 'Reiseplan'}_Travel_Overview.csv`;
    
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', fileName);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

  } catch (error) {
    console.error('Error generating CSV:', error);
    throw new Error('Fehler beim Erstellen der CSV-Datei');
  }
}

// Additional utility function for creating Excel-compatible files
export function exportTripToExcel(trip: TripWithDetails) {
  try {
    // Create a new workbook
    const workbook = XLSX.utils.book_new();

    // Overview Sheet
    const overviewData = [
      ['REISE ÜBERSICHT', '', '', ''],
      ['', '', '', ''],
      ['Reisename:', trip.name || 'Reiseplan', '', ''],
      ['Ziel:', `${trip.departure || 'N/A'} → ${trip.destination || 'N/A'}`, '', ''],
      ['Reisedatum:', trip.startDate && trip.endDate ? 
        `${new Date(trip.startDate).toLocaleDateString('de-DE')} - ${new Date(trip.endDate).toLocaleDateString('de-DE')}` : 'N/A', '', ''],
      ['Reisende:', `${trip.travelers || 1} Personen`, '', ''],
      ['Gesamtbudget:', trip.totalBudget ? `€${parseFloat(trip.totalBudget).toLocaleString()}` : 'N/A', '', ''],
      ['', '', '', ''],
      ['SCHNELLZUGRIFF', '', '', ''],
      ['Flug buchen:', trip.departure && trip.destination && trip.startDate && trip.endDate && trip.travelers ? 
        createOmioBookingLink(trip.departure, trip.destination, trip.startDate, trip.endDate, trip.travelers) : 'N/A', '', ''],
      ['', '', '', ''],
    ];

    const overviewSheet = XLSX.utils.aoa_to_sheet(overviewData);
    
    // Set column widths
    overviewSheet['!cols'] = [
      { width: 20 }, { width: 40 }, { width: 15 }, { width: 15 }
    ];

    XLSX.utils.book_append_sheet(workbook, overviewSheet, 'Übersicht');

    // Budget Sheet
    if (trip.budgetItems.length > 0) {
      const budgetData = [
        ['BUDGET ÜBERSICHT', '', '', '', '', ''],
        ['', '', '', '', '', ''],
        ['Kategorie', 'Unterkategorie', 'Menge', 'Einzelpreis', 'Gesamtpreis', 'Link'],
      ];

      let totalExpenses = 0;

      trip.budgetItems.forEach((item) => {
        const totalPrice = parseFloat(item.totalPrice || '0');
        totalExpenses += totalPrice;
        
        budgetData.push([
          item.category,
          item.subcategory || '',
          (item.quantity || 1).toString(),
          parseFloat(item.unitPrice || '0').toString(),
          totalPrice.toString(),
          item.affiliateLink || ''
        ]);

        if (item.comment) {
          budgetData.push(['', `💬 ${item.comment}`, '', '', '', '']);
        }
      });

      budgetData.push(['', '', '', '', '', '']);
      budgetData.push(['SUMME', '', '', '', totalExpenses.toString(), '']);
      
      if (trip.totalBudget) {
        const budget = parseFloat(trip.totalBudget);
        const savings = budget - totalExpenses;
        budgetData.push(['BUDGET', '', '', '', budget.toString(), '']);
        budgetData.push(['ERSPARNIS', '', '', '', savings.toString(), '']);
      }

      const budgetSheet = XLSX.utils.aoa_to_sheet(budgetData);
      
      // Set column widths
      budgetSheet['!cols'] = [
        { width: 20 }, { width: 20 }, { width: 10 }, { width: 15 }, { width: 15 }, { width: 50 }
      ];

      XLSX.utils.book_append_sheet(workbook, budgetSheet, 'Budget');
    }

    // Activities Sheet
    if (trip.activities.length > 0) {
      const activitiesData = [
        ['AKTIVITÄTEN & SEHENSWÜRDIGKEITEN', '', '', '', '', '', ''],
        ['', '', '', '', '', '', ''],
        ['Titel', 'Ort', 'Datum', 'Zeit', 'Preis', 'Status', 'Buchungslink'],
      ];

      trip.activities.forEach((activity) => {
        let timeStr = '';
        if (activity.timeFrom) {
          timeStr = activity.timeFrom;
          if (activity.timeTo) {
            timeStr += ` - ${activity.timeTo}`;
          }
        }

        activitiesData.push([
          activity.title,
          activity.location || '',
          activity.date ? new Date(activity.date).toLocaleDateString('de-DE') : '',
          timeStr,
          activity.price ? `€${parseFloat(activity.price).toLocaleString()}` : 'Kostenlos',
          activity.status || 'geplant',
          activity.bookingLink || (activity.location ? createGoogleMapsLink(activity.location) : '')
        ]);

        if (activity.comment) {
          activitiesData.push(['', `💬 ${activity.comment}`, '', '', '', '', '']);
        }
      });

      const activitiesSheet = XLSX.utils.aoa_to_sheet(activitiesData);
      
      // Set column widths
      activitiesSheet['!cols'] = [
        { width: 30 }, { width: 25 }, { width: 12 }, { width: 15 }, { width: 12 }, { width: 12 }, { width: 50 }
      ];

      XLSX.utils.book_append_sheet(workbook, activitiesSheet, 'Aktivitäten');
    }

    // Restaurants Sheet
    if (trip.restaurants.length > 0) {
      const restaurantsData = [
        ['RESTAURANTS & GASTRONOMIE', '', '', '', '', '', '', ''],
        ['', '', '', '', '', '', '', ''],
        ['Name', 'Adresse', 'Küche', 'Datum', 'Zeit', 'Preisklasse', 'Status', 'Reservierungslink'],
      ];

      trip.restaurants.forEach((restaurant) => {
        let timeStr = '';
        if (restaurant.timeFrom) {
          timeStr = restaurant.timeFrom;
          if (restaurant.timeTo) {
            timeStr += ` - ${restaurant.timeTo}`;
          }
        }

        restaurantsData.push([
          restaurant.name,
          restaurant.address || '',
          restaurant.cuisine || '',
          restaurant.date ? new Date(restaurant.date).toLocaleDateString('de-DE') : '',
          timeStr,
          restaurant.priceRange || '',
          restaurant.status || 'geplant',
          restaurant.reservationLink || (restaurant.address ? createGoogleMapsLink(restaurant.address) : '')
        ]);

        if (restaurant.comment) {
          restaurantsData.push(['', `💬 ${restaurant.comment}`, '', '', '', '', '', '']);
        }
      });

      const restaurantsSheet = XLSX.utils.aoa_to_sheet(restaurantsData);
      
      // Set column widths
      restaurantsSheet['!cols'] = [
        { width: 25 }, { width: 30 }, { width: 15 }, { width: 12 }, { width: 15 }, { width: 15 }, { width: 12 }, { width: 50 }
      ];

      XLSX.utils.book_append_sheet(workbook, restaurantsSheet, 'Restaurants');
    }

    // Generate Excel file
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    
    const fileName = `${trip.name || 'Reiseplan'}_Travel_Overview.xlsx`;
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', fileName);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

  } catch (error) {
    console.error('Error generating Excel:', error);
    throw new Error('Fehler beim Erstellen der Excel-Datei');
  }
}

