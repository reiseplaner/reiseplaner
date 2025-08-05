# Profilbild-Upload Feature

## Übersicht
Das Profilbild-Upload-Feature ermöglicht es Benutzern, ihre Profilbilder hochzuladen und zu verwalten.

## Unterstützte Dateiformate
- **PNG** (.png)
- **JPEG/JPG** (.jpg, .jpeg)
- **GIF** (.gif)
- **WebP** (.webp)
- **Alle anderen Bildformate** die vom Browser unterstützt werden

## Technische Spezifikationen
- **Maximale Dateigröße**: 5MB
- **Speicherort**: `uploads/profiles/` Verzeichnis
- **Dateinamen**: `profile-{timestamp}-{random}.{extension}`

## Backend-Implementierung

### API-Endpoint
```
POST /api/auth/profile-image
Content-Type: multipart/form-data
Authorization: Bearer {token}
```

### Multer-Konfiguration
```javascript
const upload = multer({
  storage: multer.diskStorage({
    destination: 'uploads/profiles/',
    filename: 'profile-{timestamp}-{random}.{extension}'
  }),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Nur Bilddateien sind erlaubt!'), false);
    }
  }
});
```

### Storage-Funktion
```javascript
async updateUserProfileImage(userId: string, profileImageUrl: string): Promise<User | undefined> {
  const [updatedUser] = await db
    .update(users)
    .set({ 
      profileImageUrl,
      updatedAt: new Date(),
    })
    .where(eq(users.id, userId))
    .returning();
  return updatedUser;
}
```

## Frontend-Implementierung

### Upload-Handler
```javascript
const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
  const file = event.target.files?.[0];
  if (!file) return;

  // Validierung
  if (!file.type.startsWith('image/')) {
    // Fehler: Ungültiger Dateityp
    return;
  }

  if (file.size > 5 * 1024 * 1024) {
    // Fehler: Datei zu groß
    return;
  }

  // Upload
  setIsUploadingImage(true);
  uploadImageMutation.mutate(file);
};
```

### Mutation
```javascript
const uploadImageMutation = useMutation({
  mutationFn: async (file: File) => {
    const formData = new FormData();
    formData.append('profileImage', file);
    
    const response = await apiRequest("POST", "/api/auth/profile-image", formData);
    return response.json();
  },
  onSuccess: (data) => {
    toast({ title: "Profilbild aktualisiert" });
    queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
  },
  onError: (error) => {
    toast({ title: "Fehler", description: error.message });
  },
});
```

## Fehlerbehebung

### Problem: Upload funktioniert nicht
1. **Server läuft nicht**: Stelle sicher, dass der Backend-Server auf Port 5000 läuft
2. **Uploads-Verzeichnis fehlt**: Das Verzeichnis `uploads/profiles/` wird automatisch erstellt
3. **Authentifizierung**: Stelle sicher, dass der Benutzer eingeloggt ist
4. **Dateigröße**: Prüfe, ob die Datei unter 5MB ist
5. **Dateityp**: Nur Bilddateien sind erlaubt

### Problem: Bild wird nicht angezeigt
1. **Static File Serving**: Stelle sicher, dass `/uploads` korrekt als statisches Verzeichnis konfiguriert ist
2. **Pfad**: Prüfe, ob der `profileImageUrl` korrekt in der Datenbank gespeichert ist
3. **Berechtigung**: Stelle sicher, dass das uploads-Verzeichnis lesbar ist

### Debugging
- Öffne die Browser-Entwicklertools (F12)
- Schaue in die Console für Upload-Logs
- Prüfe die Network-Tab für API-Requests
- Backend-Logs zeigen detaillierte Upload-Informationen

## Setup-Anweisungen

1. **Uploads-Verzeichnis erstellen**:
   ```bash
   mkdir -p uploads/profiles
   ```

2. **Server starten**:
   ```bash
   cd server && npm run dev
   ```

3. **Frontend starten**:
   ```bash
   cd client && npm run dev
   ```

4. **Testen**:
   - Gehe zur Profil-Seite (`/profile`)
   - Klicke auf das Kamera-Symbol
   - Wähle ein Bild aus (PNG, JPG, etc.)
   - Das Bild sollte hochgeladen und angezeigt werden 