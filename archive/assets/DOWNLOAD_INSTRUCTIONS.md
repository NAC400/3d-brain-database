# NIH Visible Human Project - Updated Download Instructions

## 🚨 **Current Status Update (2024)**

Based on our investigation, the NIH Visible Human Project has **updated its access methods**. Here's the current situation:

### **✅ Current Working Access Method**

**Primary Download Portal:**
```
https://datadiscovery.nlm.nih.gov/Images/Visible-Human-Project/ux2j-9i9a/about_data
```

### **📂 Available Datasets**

1. **VHP Male Data**: `https://data.lhncbc.nlm.nih.gov/public/Visible-Human/Male-Images/index.html`
2. **VHP Female Data**: `https://data.lhncbc.nlm.nih.gov/public/Visible-Human/Female-Images/index.html`
3. **Sample Data**: `https://data.lhncbc.nlm.nih.gov/public/Visible-Human/Sample-Data/index.html`

---

## 🎯 **Recommended Download Strategy**

### **Step 1: Access Sample Data First**
1. Go to: `https://data.lhncbc.nlm.nih.gov/public/Visible-Human/Sample-Data/index.html`
2. Download small sample files for testing your React/Three.js integration
3. This helps verify your setup before downloading larger datasets

### **Step 2: Download High-Resolution Brain Slices**

**For brain region visualization (recommended):**
- Files 1100-1200 (brain region)
- Files 1500-1600 (brain region)
- PNG format is recommended for web applications

**Manual Download Process:**
1. Visit: `https://data.lhncbc.nlm.nih.gov/public/Visible-Human/Male-Images/PNG_format/`
2. Right-click and save files in the 1100-1200 range
3. Save to: `D:\neman\Projects\3d-brain-data\assets\models\brain\visible-human-male\png\`
4. Rename files to: `male_1100.png`, `male_1101.png`, etc.

---

## 🔧 **Alternative: Automated Download Script**

Create this PowerShell script for bulk download:

```powershell
# bulk_download.ps1
$baseUrl = "https://data.lhncbc.nlm.nih.gov/public/Visible-Human/Male-Images/PNG_format/"
$outputDir = "D:\neman\Projects\3d-brain-data\assets\models\brain\visible-human-male\png\"

# Brain region files (1100-1150)
for ($i = 1100; $i -le 1150; $i++) {
    $filename = "a_vm$i.png"
    $url = $baseUrl + $filename
    $outputFile = $outputDir + "male_$i.png"
    
    try {
        Write-Host "Downloading $filename..."
        Invoke-WebRequest -Uri $url -OutFile $outputFile -ErrorAction Stop
        Write-Host "✅ Downloaded: $outputFile"
    }
    catch {
        Write-Host "❌ Failed to download: $filename"
    }
}
```

---

## 🌐 **Browser-Based Download (Recommended for Now)**

**Given the current access issues, use manual browser download:**

1. **Open Browser** and navigate to:
   ```
   https://data.lhncbc.nlm.nih.gov/public/Visible-Human/Male-Images/PNG_format/
   ```

2. **Download Brain Region Files** (right-click save):
   - `a_vm1100.png` → Save as `male_1100.png`
   - `a_vm1101.png` → Save as `male_1101.png`
   - `a_vm1102.png` → Save as `male_1102.png`
   - Continue for 10-20 files...

3. **Save Location**: 
   ```
   D:\neman\Projects\3d-brain-data\assets\models\brain\visible-human-male\png\
   ```

---

## 🎮 **Test Your Download**

Once you have a few files, test the integration:

```javascript
// Test loading in your React component
import { useLoader } from '@react-three/fiber';
import { TextureLoader } from 'three';

function BrainSliceTest() {
    const texture = useLoader(TextureLoader, '/assets/models/brain/visible-human-male/png/male_1100.png');
    
    return (
        <mesh>
            <planeGeometry args={[10, 6]} />
            <meshBasicMaterial map={texture} />
        </mesh>
    );
}
```

---

## 📊 **File Information**

- **Format**: PNG (24-bit color)
- **Resolution**: 2048 × 1216 pixels  
- **File Size**: ~7.5 MB per slice
- **Spacing**: 1mm intervals
- **Brain Region**: Files 1000-1300 approximately

---

## 🔄 **Next Steps After Download**

1. **Test Loading**: Verify files load in your React app
2. **Optimize**: Convert to optimized formats if needed
3. **Segment**: Use tools to separate brain regions
4. **Integrate**: Add to your existing Three.js scene

---

## ⚠️ **Important Notes**

- **No License Required**: As of 2019, no registration needed
- **Public Domain**: Free for research and commercial use
- **File Size**: Male dataset ~15GB, Female ~40GB
- **Bandwidth**: Consider download limits and timing 