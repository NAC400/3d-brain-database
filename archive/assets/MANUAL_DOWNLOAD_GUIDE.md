# NIH Visible Human Project - Manual Download Guide

## 🚀 **Step-by-Step Download Instructions**

### **Step 1: Access the Data Portal**

1. **Open your web browser** and go to the main NIH data portal:
   ```
   https://data.lhncbc.nlm.nih.gov/public/Visible-Human/
   ```

2. **Important:** No registration required (as of 2019)!

---

### **Step 2: Start with Sample Data (Recommended)**

**For testing your application first:**

1. Go to: `https://data.lhncbc.nlm.nih.gov/public/Visible-Human/Sample-Data/`
2. Download the sample files to test your integration
3. Save to: `D:\neman\Projects\3d-brain-data\assets\models\brain\samples\`

---

### **Step 3: Download Male Dataset (15GB)**

**Access the male dataset:**
```
https://data.lhncbc.nlm.nih.gov/public/Visible-Human/Male-Images/
```

**Recommended download order:**

1. **Start with PNG format** (easiest for web apps):
   - Go to: `Male-Images/PNG_format/`
   - Download a few sample PNG files first (e.g., files 0800-0850)
   - Save to: `models/brain/visible-human-male/png/`

2. **Full Color format** (high quality):
   - Go to: `Male-Images/Fullcolor/`
   - Download selected .raw files 
   - Save to: `models/brain/visible-human-male/fullcolor/`

3. **70mm format** (highest resolution):
   - Go to: `Male-Images/70mm/`
   - Download selected high-res files
   - Save to: `models/brain/visible-human-male/70mm/`

---

### **Step 4: Download Female Dataset (40GB)**

**Access the female dataset:**
```
https://data.lhncbc.nlm.nih.gov/public/Visible-Human/Female-Images/
```

**Follow same process as male dataset:**

1. **PNG format**: `Female-Images/PNG_format/` → `models/brain/visible-human-female/png/`
2. **Full Color**: `Female-Images/Fullcolor/` → `models/brain/visible-human-female/fullcolor/`
3. **70mm format**: `Female-Images/70mm/` → `models/brain/visible-human-female/70mm/`

---

### **Step 5: Recommended Brain Region Files**

**For brain visualization, focus on these slice ranges:**

#### **Male Dataset:**
- **Head/Brain region**: Files 0001-0300 (approximate)
- **Brain cross-sections**: Files 0800-1200 (brain-heavy region)
- **Lower brain/neck**: Files 0300-0800

#### **Female Dataset:**
- **Similar regions but with higher resolution**
- **More slices available** (5,189 vs 1,871)

---

### **Step 6: File Organization**

**After downloading, organize like this:**

```
assets/
├── models/
│   └── brain/
│       ├── visible-human-male/
│       │   ├── png/          # PNG format files
│       │   ├── fullcolor/    # RAW format files  
│       │   └── 70mm/         # High-res files
│       ├── visible-human-female/
│       │   ├── png/
│       │   ├── fullcolor/
│       │   └── 70mm/
│       └── samples/          # Test files
├── metadata/
│   └── visible-human/        # Documentation
└── textures/
    └── visible-human/        # Processed textures
```

---

### **Step 7: Integration with Your React App**

**Once you have the files downloaded:**

1. **Import the integration helper:**
   ```javascript
   import { VisibleHumanBrain, SliceNavigator } from './assets/integrate_visible_human.js';
   ```

2. **Use in your React component:**
   ```javascript
   function BrainViewer() {
     const [currentSlice, setCurrentSlice] = useState(0);
     
     return (
       <div style={{ width: '100vw', height: '100vh', position: 'relative' }}>
         <Canvas>
           <ambientLight intensity={0.5} />
           <pointLight position={[10, 10, 10]} />
           <VisibleHumanBrain 
             dataset="male"
             startSlice={800}
             sliceCount={50}
             position={[0, 0, 0]}
           />
           <OrbitControls />
         </Canvas>
         
         <SliceNavigator
           currentSlice={currentSlice}
           totalSlices={50}
           onSliceChange={setCurrentSlice}
           dataset="male"
         />
       </div>
     );
   }
   ```

---

### **Step 8: Performance Tips**

1. **Start small**: Download 10-20 slices first to test
2. **Use PNG format**: Most compatible with web browsers
3. **Optimize loading**: Load slices on-demand in your app
4. **Cache textures**: Use the built-in caching in the integration helper
5. **Progressive loading**: Load lower-res first, then higher-res

---

### **Step 9: Naming Convention**

**Expected file naming for integration:**
- Male files: `male_0001.png`, `male_0002.png`, etc.
- Female files: `female_0001.png`, `female_0002.png`, etc.

**If downloaded files have different names, rename them to match this pattern**

---

### **Step 10: Testing Your Download**

**Quick test to verify everything works:**

1. Download 5-10 consecutive PNG files from male dataset
2. Place them in `models/brain/visible-human-male/png/`
3. Rename to follow the `male_XXXX.png` pattern
4. Test with the React integration component
5. If it works, download more slices as needed

---

## 🔥 **Pro Tips**

### **Download Manager Recommended**
- Use a download manager like **Free Download Manager** or **JDownloader**
- Set up batch downloads for multiple files
- Resume interrupted downloads for large files

### **Brain-Specific Slices**
- **Male dataset**: Slices 800-1200 contain the most brain tissue
- **Female dataset**: Similar range but with finer resolution
- Start with these ranges for brain visualization

### **File Size Management**
- **Single PNG file**: ~3-7 MB each
- **Full dataset**: Can be 15-40 GB total
- **Recommended**: Download 100-200 slices to start

### **Browser-Based Download**
- Right-click on file links and "Save As"
- Most browsers can handle the file sizes
- Chrome/Firefox have good download management


---

## ⚡ **Quick Start Checklist**

- [ ] Create directory structure (already done ✓)
- [ ] Access NIH data portal
- [ ] Download 10 sample PNG files from male dataset
- [ ] Rename files to `male_XXXX.png` format
- [ ] Place in `models/brain/visible-human-male/png/`
- [ ] Test with React integration component
- [ ] Download more slices as needed
- [ ] Optimize and expand your brain visualization

---

## 📞 **Need Help?**

If you encounter issues:
1. Check the NIH website for any access changes
2. Verify file naming conventions match the integration code
3. Test with smaller file batches first
4. Check browser compatibility for large downloads

**You're now ready to download and integrate real medical-grade brain data into your 3D research platform!** 🧠✨ 