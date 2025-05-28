import jsPDF from 'jspdf';
import Papa from 'papaparse';
import type { TripWithDetails } from '@shared/schema';

export function exportTripToPDF(trip: TripWithDetails) {
  const pdf = new jsPDF();
  let yPosition = 20;
  const lineHeight = 7;
  const pageWidth = pdf.internal.pageSize.getWidth();
  const margin = 20;
  const contentWidth = pageWidth - 2 * margin;

  // Helper function to add text with automatic line breaks
  const addText = (text: string, x: number, y: number, options?: any) => {
    const lines = pdf.splitTextToSize(text, contentWidth);
    pdf.text(lines, x, y, options);
    return y + (lines.length * lineHeight);
  };

  // Helper function to check if we need a new page
  const checkNewPage = (requiredSpace: number) => {
    if (yPosition + requiredSpace > pdf.internal.pageSize.getHeight() - margin) {
      pdf.addPage();
      yPosition = margin;
    }
  };

  try {
    // Title
    pdf.setFontSize(20);
    pdf.setFont('helvetica', 'bold');
    yPosition = addText(trip.name || 'Reiseplan', margin, yPosition);
    yPosition += 10;

    // Trip Details
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'normal');
    
    if (trip.destination) {
      yPosition = addText(`Ziel: ${trip.destination}`, margin, yPosition);
    }
    
    if (trip.departure) {
      yPosition = addText(`Abflug: ${trip.departure}`, margin, yPosition);
    }
    
    if (trip.startDate && trip.endDate) {
      const startDate = new Date(trip.startDate).toLocaleDateString('de-DE');
      const endDate = new Date(trip.endDate).toLocaleDateString('de-DE');
      yPosition = addText(`Zeitraum: ${startDate} - ${endDate}`, margin, yPosition);
    }
    
    if (trip.travelers) {
      yPosition = addText(`Reisende: ${trip.travelers} Personen`, margin, yPosition);
    }
    
    if (trip.totalBudget) {
      yPosition = addText(`Gesamtbudget: €${parseFloat(trip.totalBudget).toLocaleString()}`, margin, yPosition);
    }
    
    yPosition += 10;

    // Budget Items
    if (trip.budgetItems.length > 0) {
      checkNewPage(40);
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      yPosition = addText('Budget-Übersicht', margin, yPosition);
      yPosition += 5;

      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      
      trip.budgetItems.forEach((item) => {
        checkNewPage(15);
        const itemText = `${item.category} - ${item.subcategory || 'N/A'}: ${item.quantity}x €${parseFloat(item.unitPrice || '0').toLocaleString()} = €${parseFloat(item.totalPrice || '0').toLocaleString()}`;
        yPosition = addText(itemText, margin, yPosition);
        
        if (item.comment) {
          pdf.setFont('helvetica', 'italic');
          yPosition = addText(`  Kommentar: ${item.comment}`, margin, yPosition);
          pdf.setFont('helvetica', 'normal');
        }
      });
      
      yPosition += 10;
    }

    // Activities
    if (trip.activities.length > 0) {
      checkNewPage(40);
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      yPosition = addText('Aktivitäten', margin, yPosition);
      yPosition += 5;

      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      
      trip.activities.forEach((activity) => {
        checkNewPage(20);
        yPosition = addText(`${activity.title}`, margin, yPosition);
        
        if (activity.location) {
          yPosition = addText(`  Ort: ${activity.location}`, margin, yPosition);
        }
        
        if (activity.date) {
          const dateStr = new Date(activity.date).toLocaleDateString('de-DE');
          const timeStr = activity.time ? ` um ${activity.time}` : '';
          yPosition = addText(`  Datum: ${dateStr}${timeStr}`, margin, yPosition);
        }
        
        if (activity.price) {
          yPosition = addText(`  Preis: €${parseFloat(activity.price).toLocaleString()} pro Person`, margin, yPosition);
        }
        
        if (activity.comment) {
          pdf.setFont('helvetica', 'italic');
          yPosition = addText(`  Kommentar: ${activity.comment}`, margin, yPosition);
          pdf.setFont('helvetica', 'normal');
        }
        
        if (activity.bookingLink) {
          yPosition = addText(`  Buchungslink: ${activity.bookingLink}`, margin, yPosition);
        }
        
        yPosition += 3;
      });
      
      yPosition += 10;
    }

    // Restaurants
    if (trip.restaurants.length > 0) {
      checkNewPage(40);
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      yPosition = addText('Restaurants', margin, yPosition);
      yPosition += 5;

      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      
      trip.restaurants.forEach((restaurant) => {
        checkNewPage(20);
        yPosition = addText(`${restaurant.name}`, margin, yPosition);
        
        if (restaurant.address) {
          yPosition = addText(`  Adresse: ${restaurant.address}`, margin, yPosition);
        }
        
        if (restaurant.date) {
          const dateStr = new Date(restaurant.date).toLocaleDateString('de-DE');
          const timeStr = restaurant.time ? ` um ${restaurant.time}` : '';
          yPosition = addText(`  Datum: ${dateStr}${timeStr}`, margin, yPosition);
        }
        
        if (restaurant.cuisine) {
          yPosition = addText(`  Küche: ${restaurant.cuisine}`, margin, yPosition);
        }
        
        if (restaurant.priceRange) {
          yPosition = addText(`  Preisklasse: ${restaurant.priceRange}`, margin, yPosition);
        }
        
        if (restaurant.comment) {
          pdf.setFont('helvetica', 'italic');
          yPosition = addText(`  Kommentar: ${restaurant.comment}`, margin, yPosition);
          pdf.setFont('helvetica', 'normal');
        }
        
        if (restaurant.reservationLink) {
          yPosition = addText(`  Reservierungslink: ${restaurant.reservationLink}`, margin, yPosition);
        }
        
        yPosition += 3;
      });
    }

    // Save the PDF
    const fileName = `${trip.name || 'Reiseplan'}.pdf`;
    pdf.save(fileName);

  } catch (error) {
    console.error('Error generating PDF:', error);
    throw new Error('Fehler beim Erstellen der PDF-Datei');
  }
}

export function exportTripToCSV(trip: TripWithDetails) {
  try {
    const csvData: any[] = [];

    // Trip information
    csvData.push({
      Typ: 'Reiseinformation',
      Name: trip.name,
      Kategorie: 'Allgemein',
      Datum: trip.startDate ? new Date(trip.startDate).toLocaleDateString('de-DE') : '',
      Zeit: '',
      Ort: trip.destination,
      Preis: trip.totalBudget ? `€${parseFloat(trip.totalBudget).toLocaleString()}` : '',
      Status: '',
      Kommentar: `Reise von ${trip.departure || 'N/A'} nach ${trip.destination || 'N/A'}, ${trip.travelers || 1} Personen`,
      Link: ''
    });

    // Budget items
    trip.budgetItems.forEach((item) => {
      csvData.push({
        Typ: 'Budget',
        Name: item.subcategory || item.category,
        Kategorie: item.category,
        Datum: '',
        Zeit: '',
        Ort: '',
        Preis: `€${parseFloat(item.totalPrice || '0').toLocaleString()}`,
        Status: '',
        Kommentar: item.comment || '',
        Link: item.affiliateLink || ''
      });
    });

    // Activities
    trip.activities.forEach((activity) => {
      csvData.push({
        Typ: 'Aktivität',
        Name: activity.title,
        Kategorie: 'Aktivität',
        Datum: activity.date ? new Date(activity.date).toLocaleDateString('de-DE') : '',
        Zeit: activity.time || '',
        Ort: activity.location || '',
        Preis: activity.price ? `€${parseFloat(activity.price).toLocaleString()}` : '',
        Status: activity.status || 'geplant',
        Kommentar: activity.comment || '',
        Link: activity.bookingLink || ''
      });
    });

    // Restaurants
    trip.restaurants.forEach((restaurant) => {
      csvData.push({
        Typ: 'Restaurant',
        Name: restaurant.name,
        Kategorie: restaurant.cuisine || 'Restaurant',
        Datum: restaurant.date ? new Date(restaurant.date).toLocaleDateString('de-DE') : '',
        Zeit: restaurant.time || '',
        Ort: restaurant.address || '',
        Preis: restaurant.priceRange || '',
        Status: restaurant.status || 'geplant',
        Kommentar: restaurant.comment || '',
        Link: restaurant.reservationLink || ''
      });
    });

    // Convert to CSV
    const csv = Papa.unparse(csvData, {
      delimiter: ';', // Use semicolon for German Excel compatibility
      header: true
    });

    // Create and download file
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const fileName = `${trip.name || 'Reiseplan'}.csv`;
    
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
