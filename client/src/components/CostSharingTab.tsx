import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TripWithDetails, BudgetItem, Activity, Restaurant } from "@shared/schema";
import { Upload, FileText, X, Receipt, Save, Trash2, Edit2, Check, Crown, Lock } from "lucide-react";
import jsPDF from "jspdf";
import { apiRequest } from "@/lib/queryClient";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";

interface SubscriptionInfo {
  status: 'free' | 'pro' | 'veteran';
  tripsUsed: number;
  tripsLimit: number;
  canExport: boolean;
}

interface PersonShare {
  name: string;
  percent: number;
  isPayer: boolean;
}

interface Receipt {
  id: string;
  filename: string;
  url: string;
  uploadedAt: string;
}

interface Debt {
  from: string;
  to: string;
  amount: number;
}

interface SavedReceipt {
  id: string;
  date: string;
  type: 'budget' | 'activity' | 'restaurant';
  itemName: string;
  total: number;
  payer: string;
  debts: Debt[];
  persons: PersonShare[];
}

interface CostSharingTabProps {
  trip: TripWithDetails;
}

export default function CostSharingTab({ trip }: CostSharingTabProps) {
  // Abonnement-Status abfragen
  const { data: subscriptionInfo, isLoading: isLoadingSubscription } = useQuery<SubscriptionInfo>({
    queryKey: ["/api/user/subscription"],
    retry: false,
    staleTime: 0, // Always consider data stale
    refetchOnWindowFocus: true, // Refetch when window gains focus
    refetchOnMount: true, // Always refetch on mount
  });

  const [selectedType, setSelectedType] = useState<'budget' | 'activity' | 'restaurant'>('budget');
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [personCount, setPersonCount] = useState<number>(trip.travelers || 1);
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const [showReceipt, setShowReceipt] = useState(false);
  const [savedReceipts, setSavedReceipts] = useState<SavedReceipt[]>([]);
  const [showSummary, setShowSummary] = useState(false);
  const [editingReceiptId, setEditingReceiptId] = useState<string | null>(null);
  const [editingPersons, setEditingPersons] = useState<PersonShare[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedReceiptIds, setSelectedReceiptIds] = useState<string[]>([]);
  const [showSelectedSummary, setShowSelectedSummary] = useState(false);
  const [persons, setPersons] = useState<PersonShare[]>(
    (() => {
      const count = trip.travelers || 1;
      const base = Math.floor((10000 / count)) / 100; // z.B. 33.33
      const rest = +(100 - base * count).toFixed(2); // z.B. 0.01
      return Array.from({ length: count }, (_, i) => ({
        name: `Person ${i + 1}`,
        percent: i === 0 ? +(base + rest).toFixed(2) : base,
        isPayer: i === 0 // Erste Person ist standardmäßig Bezahler
      }));
    })()
  );

  // Items
  const budgetItems = trip.budgetItems || [];
  const activities = trip.activities || [];
  const restaurants = trip.restaurants || [];

  // Item finden
  let selectedItem: BudgetItem | Activity | Restaurant | undefined;
  if (selectedType === 'budget') selectedItem = budgetItems.find(i => i.id === selectedId);
  if (selectedType === 'activity') selectedItem = activities.find(i => i.id === selectedId);
  if (selectedType === 'restaurant') selectedItem = restaurants.find(i => i.id === selectedId);

  // Preis ermitteln
  let total = 0;
  if (selectedType === 'budget' && selectedItem) total = Number((selectedItem as BudgetItem).totalPrice || 0);
  if (selectedType === 'activity' && selectedItem) total = Number((selectedItem as Activity).price || 0);
  if (selectedType === 'restaurant' && selectedItem) total = Number((selectedItem as Restaurant).priceRange || 0); // Annahme: priceRange ist Zahl

  // Lade gespeicherte Belege beim Komponenten-Mount
  useEffect(() => {
    loadSavedReceipts();
  }, [trip.id]);

  // API-Funktionen
  const loadSavedReceipts = async () => {
    try {
      setIsLoading(true);
      const response = await apiRequest('GET', `/api/trips/${trip.id}/cost-sharing-receipts`);
      const receipts = await response.json();
      
      // Konvertiere API-Format zu lokalem Format
      const convertedReceipts: SavedReceipt[] = receipts.map((r: any) => ({
        id: r.id.toString(),
        date: r.createdAt,
        type: r.itemType,
        itemName: r.itemName,
        total: parseFloat(r.total),
        payer: r.payer,
        debts: r.debts,
        persons: r.persons
      }));
      setSavedReceipts(convertedReceipts);
    } catch (error) {
      console.error('Fehler beim Laden der Belege:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveReceiptToAPI = async (receipt: SavedReceipt) => {
    try {
      const response = await apiRequest('POST', `/api/trips/${trip.id}/cost-sharing-receipts`, {
        itemType: receipt.type,
        itemName: receipt.itemName,
        total: receipt.total.toString(),
        payer: receipt.payer,
        persons: receipt.persons,
        debts: receipt.debts
      });
      
      const savedReceipt = await response.json();
      return savedReceipt.id.toString();
    } catch (error) {
      console.error('Fehler beim Speichern des Belegs:', error);
      return null;
    }
  };

  const updateReceiptInAPI = async (receiptId: string, receipt: Partial<SavedReceipt>) => {
    try {
      await apiRequest('PUT', `/api/trips/${trip.id}/cost-sharing-receipts/${receiptId}`, {
        itemType: receipt.type,
        itemName: receipt.itemName,
        total: receipt.total?.toString(),
        payer: receipt.payer,
        persons: receipt.persons,
        debts: receipt.debts
      });
      
      return true;
    } catch (error) {
      console.error('Fehler beim Aktualisieren des Belegs:', error);
      return false;
    }
  };

  const deleteReceiptFromAPI = async (receiptId: string) => {
    try {
      await apiRequest('DELETE', `/api/trips/${trip.id}/cost-sharing-receipts/${receiptId}`);
      return true;
    } catch (error) {
      console.error('Fehler beim Löschen des Belegs:', error);
      return false;
    }
  };

  // Handler für Personenzahl ändern
  const handlePersonCountChange = (newCount: number) => {
    setPersonCount(newCount);
    setPersons(prev => {
      // Neue Initialverteilung mit optimalen Dezimalstellen
      const base = Math.floor((10000 / newCount)) / 100;
      const rest = +(100 - base * newCount).toFixed(2);
      const arr = Array.from({ length: newCount }, (_, i) => ({
        name: prev[i]?.name || `Person ${i + 1}`,
        percent: i === 0 ? +(base + rest).toFixed(2) : base,
        isPayer: i === 0 // Erste Person ist standardmäßig Bezahler
      }));
      return arr;
    });
  };

  // Handler für Namensänderung
  const handleNameChange = (idx: number, name: string) => {
    setPersons(prev => prev.map((p, i) => i === idx ? { ...p, name } : p));
  };

  // Handler für Prozentänderung
  const handlePercentChange = (idx: number, percent: number) => {
    let rest = 100 - percent;
    let others = persons.length - 1;
    let newPersons = persons.map((p, i) => i === idx ? { ...p, percent } : p);
    // Rest gleichmäßig auf andere verteilen
    if (others > 0) {
      let even = Math.floor(rest / others);
      let diff = rest - even * others;
      newPersons = newPersons.map((p, i) => {
        if (i === idx) return p;
        if (diff > 0) { diff--; return { ...p, percent: even + 1 }; }
        return { ...p, percent: even };
      });
    }
    setPersons(newPersons);
  };

  // Handler für Bezahler ändern
  const handlePayerChange = (idx: number) => {
    setPersons(prev => prev.map((p, i) => ({
      ...p,
      isPayer: i === idx
    })));
  };

  // Handler für Beleg-Upload
  const handleReceiptUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setReceipt(null);
    try {
      // Hier würde normalerweise der Upload zur API erfolgen
      // Für jetzt simulieren wir einen erfolgreichen Upload
      const mockReceipt: Receipt = {
        id: Math.random().toString(36).substr(2, 9),
        filename: file.name,
        url: URL.createObjectURL(file),
        uploadedAt: new Date().toISOString()
      };
      setReceipt(mockReceipt);
    } catch (error) {
      console.error('Fehler beim Hochladen des Belegs:', error);
    }
  };

  // Handler für Beleg-Löschen
  const handleReceiptDelete = () => {
    setReceipt(null);
  };

  // Berechne die Schulden zwischen den Personen
  const calculateDebts = (): Debt[] => {
    if (!selectedItem) return [];
    
    const payer = persons.find(p => p.isPayer);
    if (!payer) return [];

    const debts: Debt[] = [];
    const payerAmount = (payer.percent / 100) * total;
    
    persons.forEach(person => {
      if (person.name !== payer.name) {
        const personAmount = (person.percent / 100) * total;
        if (personAmount > 0) {
          debts.push({
            from: person.name,
            to: payer.name,
            amount: personAmount
          });
        }
      }
    });

    return debts;
  };

  // Generiere den Beleg-Text
  const generateReceipt = () => {
    if (!selectedItem) return null;

    const debts = calculateDebts();
    const payer = persons.find(p => p.isPayer);
    if (!payer) return null;

    const date = new Date().toLocaleDateString('de-DE');
    const time = new Date().toLocaleTimeString('de-DE');
    
    let receiptText = `
=== KOSTENTEILUNG BELEG ===
Datum: ${date}
Uhrzeit: ${time}

${selectedType === 'budget' ? 'Budget-Position' : selectedType === 'activity' ? 'Aktivität' : 'Restaurant'}: ${selectedType === 'budget' ? (selectedItem as BudgetItem).subcategory || (selectedItem as BudgetItem).category : selectedType === 'activity' ? (selectedItem as Activity).title : (selectedItem as Restaurant).name}
Gesamtbetrag: €${total.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}

Bezahlt von: ${payer.name}

Kostenaufteilung:
${persons.map(p => `- ${p.name}: €${((p.percent / 100) * total).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})} (${p.percent.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}%)`).join('\n')}

Zu zahlende Beträge:
${debts.map(d => `- ${d.from} schuldet ${d.to}: €${d.amount.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`).join('\n')}
    `;

    return receiptText;
  };

  // Handler für Beleg anzeigen/ausblenden
  const toggleReceipt = () => {
    setShowReceipt(!showReceipt);
  };

  // Handler für Beleg kopieren
  const copyReceiptToClipboard = () => {
    const receiptText = generateReceipt();
    if (receiptText) {
      navigator.clipboard.writeText(receiptText);
    }
  };

  // Speichere den aktuellen Beleg
  const saveCurrentReceipt = async () => {
    if (!selectedItem) return;

    const debts = calculateDebts();
    const payer = persons.find(p => p.isPayer);
    if (!payer) return;

    const newReceipt: SavedReceipt = {
      id: Math.random().toString(36).substr(2, 9), // Temporäre ID
      date: new Date().toISOString(),
      type: selectedType,
      itemName: selectedType === 'budget' 
        ? (selectedItem as BudgetItem).subcategory || (selectedItem as BudgetItem).category 
        : selectedType === 'activity' 
          ? (selectedItem as Activity).title 
          : (selectedItem as Restaurant).name,
      total,
      payer: payer.name,
      debts,
      persons: [...persons]
    };

    // Speichere in API
    const savedId = await saveReceiptToAPI(newReceipt);
    if (savedId) {
      newReceipt.id = savedId;
      setSavedReceipts(prev => [...prev, newReceipt]);
    }
  };

  // Lösche einen gespeicherten Beleg
  const deleteSavedReceipt = async (id: string) => {
    const success = await deleteReceiptFromAPI(id);
    if (success) {
      setSavedReceipts(prev => prev.filter(r => r.id !== id));
    }
  };

  // Generiere den Sammelbeleg
  const generateSummaryReceipt = () => {
    if (savedReceipts.length === 0) return null;

    const date = new Date().toLocaleDateString('de-DE');
    const time = new Date().toLocaleTimeString('de-DE');
    
    // Berechne Gesamtsummen pro Person
    const personTotals = new Map<string, number>();
    // Für die Saldierung: Map von from->to->amount
    const rawDebts = new Map<string, Map<string, number>>();

    savedReceipts.forEach(receipt => {
      receipt.persons.forEach(person => {
        const currentTotal = personTotals.get(person.name) || 0;
        personTotals.set(person.name, currentTotal + (person.percent / 100) * receipt.total);
      });

      receipt.debts.forEach(debt => {
        if (!rawDebts.has(debt.from)) {
          rawDebts.set(debt.from, new Map());
        }
        const fromDebts = rawDebts.get(debt.from)!;
        const currentDebt = fromDebts.get(debt.to) || 0;
        fromDebts.set(debt.to, currentDebt + debt.amount);
      });
    });

    // Saldierung der Schulden
    // Für jedes Paar (A, B): berechne Netto-Schuld
    const allNames = Array.from(personTotals.keys());
    const netDebts: { from: string; to: string; amount: number }[] = [];
    for (let i = 0; i < allNames.length; i++) {
      for (let j = i + 1; j < allNames.length; j++) {
        const a = allNames[i];
        const b = allNames[j];
        const aToB = rawDebts.get(a)?.get(b) || 0;
        const bToA = rawDebts.get(b)?.get(a) || 0;
        const diff = aToB - bToA;
        if (Math.abs(diff) > 0.01) {
          if (diff > 0) {
            netDebts.push({ from: a, to: b, amount: diff });
          } else {
            netDebts.push({ from: b, to: a, amount: -diff });
          }
        }
      }
    }

    // Generiere den Text
    let summaryText = `
=== SAMMELBELEG KOSTENTEILUNG ===
Datum: ${date}
Uhrzeit: ${time}

Gesamtkosten: €${savedReceipts.reduce((sum, r) => sum + r.total, 0).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}

Einzelne Belege:
${savedReceipts.map(r => `\n${r.type === 'budget' ? 'Budget' : r.type === 'activity' ? 'Aktivität' : 'Restaurant'}: ${r.itemName}\nBetrag: €${r.total.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}\nBezahlt von: ${r.payer}\n`).join('')}

Gesamtaufteilung pro Person:
${Array.from(personTotals.entries()).map(([name, total]) => `- ${name}: €${total.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`).join('\n')}

Zu zahlende Beträge (nach Verrechnung):
${netDebts.map(d => `- ${d.from} schuldet ${d.to}: €${d.amount.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`).join('\n')}
    `;

    return summaryText;
  };

  // Summe der Anteile
  const percentSum = persons.reduce((sum, p) => sum + p.percent, 0);
  const percentSumRounded = Math.round(percentSum);

  // Starte Bearbeitungsmodus für einen Beleg
  const startEditing = (receipt: SavedReceipt) => {
    setEditingReceiptId(receipt.id);
    setEditingPersons([...receipt.persons]);
  };

  // Beende Bearbeitungsmodus
  const cancelEditing = () => {
    setEditingReceiptId(null);
    setEditingPersons([]);
  };

  // Speichere die Änderungen eines Belegs
  const saveEditedReceipt = async () => {
    if (!editingReceiptId) return;

    const receipt = savedReceipts.find(r => r.id === editingReceiptId);
    if (!receipt) return;

    const debts = calculateDebtsForPersons(editingPersons, receipt.total);
    const payer = editingPersons.find(p => p.isPayer);
    
    const updatedReceipt = {
      ...receipt,
      persons: editingPersons,
      debts,
      payer: payer?.name || receipt.payer
    };

    const success = await updateReceiptInAPI(editingReceiptId, updatedReceipt);
    if (success) {
      setSavedReceipts(prev => prev.map(r => 
        r.id === editingReceiptId ? updatedReceipt : r
      ));
      setEditingReceiptId(null);
      setEditingPersons([]);
    }
  };

  // Berechne Schulden für eine Personengruppe
  const calculateDebtsForPersons = (persons: PersonShare[], total: number): Debt[] => {
    const payer = persons.find(p => p.isPayer);
    if (!payer) return [];

    const debts: Debt[] = [];
    persons.forEach(person => {
      if (person.name !== payer.name) {
        const personAmount = (person.percent / 100) * total;
        if (personAmount > 0) {
          debts.push({
            from: person.name,
            to: payer.name,
            amount: personAmount
          });
        }
      }
    });

    return debts;
  };

  // Handler für Namensänderung im Bearbeitungsmodus
  const handleEditingNameChange = (idx: number, name: string) => {
    setEditingPersons(prev => prev.map((p, i) => i === idx ? { ...p, name } : p));
  };

  // Handler für Prozentänderung im Bearbeitungsmodus
  const handleEditingPercentChange = (idx: number, percent: number) => {
    let rest = 100 - percent;
    let others = editingPersons.length - 1;
    let newPersons = editingPersons.map((p, i) => i === idx ? { ...p, percent } : p);
    
    if (others > 0) {
      let even = Math.floor(rest / others);
      let diff = rest - even * others;
      newPersons = newPersons.map((p, i) => {
        if (i === idx) return p;
        if (diff > 0) { diff--; return { ...p, percent: even + 1 }; }
        return { ...p, percent: even };
      });
    }
    
    setEditingPersons(newPersons);
  };

  // Handler für Bezahler-Änderung im Bearbeitungsmodus
  const handleEditingPayerChange = (idx: number) => {
    setEditingPersons(prev => prev.map((p, i) => ({
      ...p,
      isPayer: i === idx
    })));
  };

  // Exportiere den Sammelbeleg als PDF
  const exportSummaryReceiptPDF = () => {
    const summary = generateSummaryReceipt();
    if (!summary) return;
    const doc = new jsPDF();
    const lines = summary.split('\n');
    let y = 10;
    doc.setFont('courier', 'normal');
    lines.forEach(line => {
      doc.text(line, 10, y);
      y += 7;
      if (y > 280) {
        doc.addPage();
        y = 10;
      }
    });
    doc.save(`Sammelbeleg_Kostenteilung_${new Date().toISOString().slice(0,10)}.pdf`);
  };

  // Exportiere den Sammelbeleg als CSV
  const exportSummaryReceiptCSV = () => {
    const summary = generateSummaryReceipt();
    if (!summary) return;

    // CSV-Header
    let csvContent = "Typ,Artikel,Gesamt,Bezahler,Person,Anteil,Betrag\n";
    
    // Einzelne Belege
    savedReceipts.forEach(receipt => {
      receipt.persons.forEach(person => {
        const amount = (person.percent / 100) * receipt.total;
        csvContent += `"${receipt.type}","${receipt.itemName}","${receipt.total.toFixed(2)}","${receipt.payer}","${person.name}","${person.percent}%","${amount.toFixed(2)}"\n`;
      });
    });

    // Netto-Schulden
    csvContent += "\nNetto-Schulden:\n";
    csvContent += "Von,An,Betrag\n";
    
    const allPersons = new Set<string>();
    savedReceipts.forEach(receipt => {
      receipt.persons.forEach(person => allPersons.add(person.name));
    });

    const personTotals = new Map<string, number>();
    allPersons.forEach(person => personTotals.set(person, 0));

    savedReceipts.forEach(receipt => {
      receipt.persons.forEach(person => {
        const amount = (person.percent / 100) * receipt.total;
        if (person.isPayer) {
          personTotals.set(person.name, (personTotals.get(person.name) || 0) + receipt.total - amount);
        } else {
          personTotals.set(person.name, (personTotals.get(person.name) || 0) - amount);
        }
      });
    });

    Array.from(personTotals.entries())
      .filter(([_, amount]) => amount < -0.01)
      .forEach(([debtor, amount]) => {
        const creditors = Array.from(personTotals.entries())
          .filter(([_, amt]) => amt > 0.01)
          .sort((a, b) => b[1] - a[1]);
        
        let remaining = Math.abs(amount);
        creditors.forEach(([creditor, creditAmount]) => {
          if (remaining > 0.01 && creditAmount > 0.01) {
            const payment = Math.min(remaining, creditAmount);
            csvContent += `"${debtor}","${creditor}","${payment.toFixed(2)}"\n`;
            remaining -= payment;
            personTotals.set(creditor, creditAmount - payment);
          }
        });
      });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${trip.name}_sammelbeleg.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Handler für Beleg-Auswahl
  const toggleReceiptSelection = (receiptId: string) => {
    setSelectedReceiptIds(prev => 
      prev.includes(receiptId) 
        ? prev.filter(id => id !== receiptId)
        : [...prev, receiptId]
    );
  };

  const selectAllReceipts = () => {
    setSelectedReceiptIds(savedReceipts.map(r => r.id));
  };

  const clearReceiptSelection = () => {
    setSelectedReceiptIds([]);
  };

  const generateSelectedSummaryReceipt = () => {
    const selectedReceipts = savedReceipts.filter(r => selectedReceiptIds.includes(r.id));
    
    if (selectedReceipts.length === 0) {
      return "Keine Belege ausgewählt.";
    }

    const now = new Date();
    let summary = `SAMMELBELEG (Ausgewählte Belege)\n`;
    summary += `Reise: ${trip.name}\n`;
    summary += `Erstellt am: ${now.toLocaleDateString('de-DE')} um ${now.toLocaleTimeString('de-DE')}\n`;
    summary += `Anzahl Belege: ${selectedReceipts.length}\n`;
    summary += `\n${'='.repeat(50)}\n\n`;

    // Einzelne Belege
    selectedReceipts.forEach((receipt, index) => {
      summary += `BELEG ${index + 1}: ${receipt.itemName}\n`;
      summary += `Typ: ${receipt.type === 'budget' ? 'Budget' : receipt.type === 'activity' ? 'Aktivität' : 'Restaurant'}\n`;
      summary += `Gesamtbetrag: €${receipt.total.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}\n`;
      summary += `Bezahlt von: ${receipt.payer}\n`;
      summary += `Datum: ${new Date(receipt.date).toLocaleDateString('de-DE')}\n\n`;
      
      summary += `Aufteilung:\n`;
      receipt.persons.forEach(person => {
        const amount = (person.percent / 100) * receipt.total;
        summary += `  ${person.name}: ${person.percent}% = €${amount.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}${person.isPayer ? ' (Bezahler)' : ''}\n`;
      });
      summary += `\n`;
    });

    // Gesamtsumme
    const totalAmount = selectedReceipts.reduce((sum, receipt) => sum + receipt.total, 0);
    summary += `GESAMTSUMME: €${totalAmount.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}\n\n`;

    // Netto-Schulden berechnen
    const allPersons = new Set<string>();
    selectedReceipts.forEach(receipt => {
      receipt.persons.forEach(person => allPersons.add(person.name));
    });

    const personTotals = new Map<string, number>();
    allPersons.forEach(person => personTotals.set(person, 0));

    selectedReceipts.forEach(receipt => {
      receipt.persons.forEach(person => {
        const amount = (person.percent / 100) * receipt.total;
        if (person.isPayer) {
          // Bezahler bekommt Geld zurück (positiv)
          personTotals.set(person.name, (personTotals.get(person.name) || 0) + receipt.total - amount);
        } else {
          // Nicht-Bezahler schuldet Geld (negativ)
          personTotals.set(person.name, (personTotals.get(person.name) || 0) - amount);
        }
      });
    });

    summary += `NETTO-SCHULDEN (nach Verrechnung):\n`;
    summary += `${'='.repeat(30)}\n`;

    // Zeige nur finale Schulden
    const debtors = Array.from(personTotals.entries()).filter(([_, amount]) => amount < -0.01);
    const creditors = Array.from(personTotals.entries()).filter(([_, amount]) => amount > 0.01);

    if (debtors.length === 0 && creditors.length === 0) {
      summary += `Alle Schulden sind ausgeglichen.\n`;
    } else {
      // Schulden optimiert zuweisen
      const tempCreditors = creditors.map(([name, amount]) => ({ name, amount }));
      
      debtors.forEach(([debtorName, debtAmount]) => {
        let remaining = Math.abs(debtAmount);
        
        tempCreditors.forEach(creditor => {
          if (remaining > 0.01 && creditor.amount > 0.01) {
            const payment = Math.min(remaining, creditor.amount);
            summary += `${debtorName} schuldet ${creditor.name}: €${payment.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}\n`;
            remaining -= payment;
            creditor.amount -= payment;
          }
        });
      });
    }

    return summary;
  };

  // Prüfe, ob der Benutzer Zugriff auf die Kostenteilung hat
  const hasVeteranAccess = subscriptionInfo?.status === 'veteran';

  // Upgrade-Komponente für Nicht-Veteran-Benutzer
  if (isLoadingSubscription) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Kostenteilung</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="text-slate-500">Lade Abonnement-Status...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!hasVeteranAccess) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center max-w-md mx-auto">
          <div className="w-24 h-24 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Crown className="w-12 h-12 text-purple-600" />
          </div>
          
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Kostenteilung-Funktion freischalten
          </h2>
          
          <p className="text-gray-600 mb-8 leading-relaxed">
            Organisieren Sie Ihre Reisekosten mit unserer erweiterten 
            Kostenteilung. Erstellen Sie Belege und verrechnen Sie 
            Schulden automatisch.
          </p>

          <div className="bg-white rounded-lg border p-6 mb-8">
            <div className="text-purple-600 text-3xl font-bold mb-2">
              €19.99<span className="text-base font-normal text-gray-500">/Monat</span>
            </div>
            
            <div className="space-y-3 text-sm text-gray-700 mb-6">
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-green-600 flex-shrink-0" />
                <span>Erweiterte Kostenteilung mit Belegerstellung</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-green-600 flex-shrink-0" />
                <span>Automatische Schuldenverrechnung</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-green-600 flex-shrink-0" />
                <span>PDF & CSV Export</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-green-600 flex-shrink-0" />
                <span>Unbegrenzte Reisen</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-green-600 flex-shrink-0" />
                <span>Premium Support</span>
              </div>
            </div>

            <Button 
              className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3"
              onClick={() => window.open('/pricing', '_blank')}
            >
              Jetzt freischalten
            </Button>
          </div>

          <div className="text-xs text-gray-500">
            Aktueller Plan: {' '}
            <Badge variant="outline" className="text-xs">
              {subscriptionInfo?.status === 'free' ? 'Standard' : 
               subscriptionInfo?.status === 'pro' ? 'Pro Plan' : 'Veteran Plan'}
            </Badge>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Receipt className="w-5 h-5" />
          Kostenteilung
          <Badge variant="default" className="bg-purple-600 text-xs">
            <Crown className="w-3 h-3 mr-1" />
            Veteran
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex gap-4 mb-4">
          <Button variant={selectedType === 'budget' ? 'default' : 'outline'} onClick={() => setSelectedType('budget')}>Budget</Button>
          <Button variant={selectedType === 'activity' ? 'default' : 'outline'} onClick={() => setSelectedType('activity')}>Aktivitäten</Button>
          <Button variant={selectedType === 'restaurant' ? 'default' : 'outline'} onClick={() => setSelectedType('restaurant')}>Restaurants</Button>
        </div>
        <div className="mb-4">
          <select
            className="w-full border rounded p-2"
            value={selectedId ?? ''}
            onChange={e => setSelectedId(Number(e.target.value))}
          >
            <option value="">Bitte wählen...</option>
            {selectedType === 'budget' && budgetItems.map(item => (
              <option key={item.id} value={item.id}>{item.subcategory || item.category} (€{item.totalPrice})</option>
            ))}
            {selectedType === 'activity' && activities.map(item => (
              <option key={item.id} value={item.id}>{item.title} ({item.date || ''}) (€{item.price})</option>
            ))}
            {selectedType === 'restaurant' && restaurants.map(item => (
              <option key={item.id} value={item.id}>{item.name} ({item.date || ''})</option>
            ))}
          </select>
        </div>
        <div className="mb-4 flex items-center gap-2">
          <label className="text-sm">Personenanzahl:</label>
          <input
            type="number"
            min={1}
            max={20}
            value={personCount}
            onChange={e => handlePersonCountChange(Number(e.target.value))}
            className="border rounded p-1 w-16"
          />
        </div>
        <div className="mb-4">
          <table className="w-full text-sm">
            <thead>
              <tr>
                <th>Name</th>
                <th>Prozentanteil</th>
                <th>Betrag</th>
                <th>Bezahler</th>
              </tr>
            </thead>
            <tbody>
              {persons.map((person, idx) => (
                <tr key={idx}>
                  <td>
                    <input
                      type="text"
                      value={person.name}
                      onChange={e => handleNameChange(idx, e.target.value)}
                      className="border rounded p-1 w-32"
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      step="0.01"
                      value={person.percent}
                      onChange={e => handlePercentChange(idx, parseFloat(e.target.value))}
                      className="border rounded p-1 w-16"
                    />
                    %
                  </td>
                  <td>
                    {selectedItem ? `€${((person.percent / 100) * total).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}` : "-"}
                  </td>
                  <td>
                    <input
                      type="radio"
                      name="payer"
                      checked={person.isPayer}
                      onChange={() => handlePayerChange(idx)}
                      className="mr-2"
                    />
                    {person.isPayer && <span className="text-green-600 font-medium">Bezahler</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className={`mt-2 text-xs ${Math.round(persons.reduce((sum, p) => sum + p.percent, 0)) !== 100 ? 'text-red-600' : 'text-green-700'}`}>Summe der Anteile: {Math.round(persons.reduce((sum, p) => sum + p.percent, 0))}%</div>
        </div>
        {selectedItem && (
          <div className="mt-4 p-4 bg-slate-50 rounded">
            <div className="mb-2 font-medium">Gesamtkosten: <span className="text-slate-900">€{total.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span></div>
            
            <div className="mb-2">Kostenaufteilung:</div>
            <ul className="list-disc ml-6">
              {persons.map((person, idx) => (
                <li key={idx}>
                  {person.name}: <span className="font-semibold">€{((person.percent / 100) * total).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span> ({person.percent.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}%)
                  {person.isPayer && <span className="ml-2 text-green-600">(Bezahler)</span>}
                </li>
              ))}
            </ul>
            {Math.round(persons.reduce((sum, p) => sum + p.percent, 0)) !== 100 && (
              <div className="mt-2 text-xs text-red-600">Warnung: Die gerundete Summe der Anteile beträgt {Math.round(persons.reduce((sum, p) => sum + p.percent, 0))}%. Die Aufteilung erfolgt trotzdem.</div>
            )}

            {/* Beleg-Buttons */}
            <div className="mt-4 flex gap-2">
              <Button
                variant="outline"
                onClick={toggleReceipt}
                className="flex items-center gap-2"
              >
                <Receipt className="w-4 h-4" />
                {showReceipt ? 'Beleg ausblenden' : 'Beleg anzeigen'}
              </Button>
              {showReceipt && (
                <>
                  <Button
                    variant="outline"
                    onClick={copyReceiptToClipboard}
                  >
                    In Zwischenablage kopieren
                  </Button>
                  <Button
                    variant="outline"
                    onClick={saveCurrentReceipt}
                    className="flex items-center gap-2"
                  >
                    <Save className="w-4 h-4" />
                    Beleg speichern
                  </Button>
                </>
              )}
            </div>

            {/* Beleg-Anzeige */}
            {showReceipt && (
              <div className="mt-4 p-4 bg-white rounded border">
                <pre className="whitespace-pre-wrap font-mono text-sm">
                  {generateReceipt()}
                </pre>
              </div>
            )}
          </div>
        )}

        {/* Gespeicherte Belege */}
        {savedReceipts.length > 0 && (
          <div className="mt-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Gespeicherte Belege</h3>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setShowSummary(!showSummary)}
                  className="flex items-center gap-2"
                >
                  <FileText className="w-4 h-4" />
                  {showSummary ? 'Alle Belege ausblenden' : 'Alle Belege anzeigen'}
                </Button>
                {selectedReceiptIds.length > 0 && (
                  <Button
                    variant="outline"
                    onClick={() => setShowSelectedSummary(!showSelectedSummary)}
                    className="flex items-center gap-2 bg-blue-50 border-blue-200"
                  >
                    <FileText className="w-4 h-4" />
                    {showSelectedSummary ? 'Auswahl ausblenden' : `Auswahl anzeigen (${selectedReceiptIds.length})`}
                  </Button>
                )}
              </div>
            </div>

            {/* Auswahl-Buttons */}
            <div className="flex gap-2 mb-4">
              <Button
                variant="outline"
                size="sm"
                onClick={selectAllReceipts}
                disabled={selectedReceiptIds.length === savedReceipts.length}
              >
                Alle auswählen
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={clearReceiptSelection}
                disabled={selectedReceiptIds.length === 0}
              >
                Auswahl löschen
              </Button>
              {selectedReceiptIds.length > 0 && (
                <span className="text-sm text-slate-600 flex items-center">
                  {selectedReceiptIds.length} von {savedReceipts.length} Belegen ausgewählt
                </span>
              )}
            </div>

            {/* Liste der gespeicherten Belege */}
            <div className="space-y-2">
              {savedReceipts.map(receipt => (
                <div key={receipt.id} className={`bg-white rounded border ${selectedReceiptIds.includes(receipt.id) ? 'border-blue-300 bg-blue-50' : ''}`}>
                  <div className="flex items-center justify-between p-3 border-b">
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={selectedReceiptIds.includes(receipt.id)}
                        onChange={() => toggleReceiptSelection(receipt.id)}
                        className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                      />
                      <div>
                        <div className="font-medium">{receipt.itemName}</div>
                        <div className="text-sm text-slate-500">
                          {receipt.type === 'budget' ? 'Budget' : receipt.type === 'activity' ? 'Aktivität' : 'Restaurant'} • 
                          €{receipt.total.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})} • 
                          Bezahlt von: {receipt.payer}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {editingReceiptId === receipt.id ? (
                        <>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={saveEditedReceipt}
                            className="text-green-500 hover:text-green-700"
                          >
                            <Check className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={cancelEditing}
                            className="text-slate-500 hover:text-slate-700"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => startEditing(receipt)}
                            className="text-blue-500 hover:text-blue-700"
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteSavedReceipt(receipt.id)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Bearbeitungsbereich */}
                  {editingReceiptId === receipt.id && (
                    <div className="p-3">
                      <table className="w-full text-sm">
                        <thead>
                          <tr>
                            <th>Name</th>
                            <th>Prozentanteil</th>
                            <th>Betrag</th>
                            <th>Bezahler</th>
                          </tr>
                        </thead>
                        <tbody>
                          {editingPersons.map((person, idx) => (
                            <tr key={idx}>
                              <td>
                                <input
                                  type="text"
                                  value={person.name}
                                  onChange={e => handleEditingNameChange(idx, e.target.value)}
                                  className="border rounded p-1 w-32"
                                />
                              </td>
                              <td>
                                <input
                                  type="number"
                                  min={0}
                                  max={100}
                                  step="0.01"
                                  value={person.percent}
                                  onChange={e => handleEditingPercentChange(idx, parseFloat(e.target.value))}
                                  className="border rounded p-1 w-16"
                                />
                                %
                              </td>
                              <td>
                                €{((person.percent / 100) * receipt.total).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                              </td>
                              <td>
                                <input
                                  type="radio"
                                  name={`payer-${receipt.id}`}
                                  checked={person.isPayer}
                                  onChange={() => handleEditingPayerChange(idx)}
                                  className="mr-2"
                                />
                                {person.isPayer && <span className="text-green-600 font-medium">Bezahler</span>}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      <div className={`mt-2 text-xs ${Math.round(editingPersons.reduce((sum, p) => sum + p.percent, 0)) !== 100 ? 'text-red-600' : 'text-green-700'}`}>
                        Summe der Anteile: {Math.round(editingPersons.reduce((sum, p) => sum + p.percent, 0))}%
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Sammelbeleg (alle Belege) */}
            {showSummary && (
              <div className="mt-4 p-4 bg-white rounded border">
                <h4 className="font-semibold mb-2">Sammelbeleg (Alle Belege)</h4>
                <pre className="whitespace-pre-wrap font-mono text-sm">
                  {generateSummaryReceipt()}
                </pre>
                <div className="flex gap-2 mt-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      const summary = generateSummaryReceipt();
                      if (summary) {
                        navigator.clipboard.writeText(summary);
                      }
                    }}
                  >
                    Sammelbeleg kopieren
                  </Button>
                  <Button
                    variant="outline"
                    onClick={exportSummaryReceiptPDF}
                  >
                    Sammelbeleg als PDF exportieren
                  </Button>
                  <Button
                    variant="outline"
                    onClick={exportSummaryReceiptCSV}
                  >
                    Sammelbeleg als CSV exportieren
                  </Button>
                </div>
              </div>
            )}

            {/* Sammelbeleg (ausgewählte Belege) */}
            {showSelectedSummary && selectedReceiptIds.length > 0 && (
              <div className="mt-4 p-4 bg-blue-50 rounded border border-blue-200">
                <h4 className="font-semibold mb-2 text-blue-800">Sammelbeleg (Ausgewählte Belege)</h4>
                <pre className="whitespace-pre-wrap font-mono text-sm">
                  {generateSelectedSummaryReceipt()}
                </pre>
                <div className="flex gap-2 mt-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      const summary = generateSelectedSummaryReceipt();
                      if (summary) {
                        navigator.clipboard.writeText(summary);
                      }
                    }}
                    className="border-blue-300 text-blue-700 hover:bg-blue-100"
                  >
                    Auswahl-Beleg kopieren
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      const selectedReceipts = savedReceipts.filter(r => selectedReceiptIds.includes(r.id));
                      const doc = new jsPDF();
                      const summary = generateSelectedSummaryReceipt();
                      
                      doc.setFont("helvetica");
                      doc.setFontSize(12);
                      
                      const lines = summary.split('\n');
                      let y = 20;
                      
                      lines.forEach(line => {
                        if (y > 280) {
                          doc.addPage();
                          y = 20;
                        }
                        doc.text(line, 10, y);
                        y += 5;
                      });
                      
                      doc.save(`${trip.name}_auswahl_sammelbeleg.pdf`);
                    }}
                    className="border-blue-300 text-blue-700 hover:bg-blue-100"
                  >
                    Auswahl-Beleg als PDF
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        {!selectedItem && <div className="text-slate-400 mt-4">Bitte wähle ein Item aus.</div>}
      </CardContent>
    </Card>
  );
} 