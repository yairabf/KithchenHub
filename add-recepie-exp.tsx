import React, { useState, useRef, useEffect } from 'react';
import { 
  Plus, 
  X, 
  ChefHat, 
  Clock, 
  Users, 
  Trash2, 
  ArrowRight, 
  CheckCircle2,
  Camera,
  Utensils,
  Save,
  Sparkles,
  Loader2,
  Wand2,
  ChevronDown,
  Tag
} from 'lucide-react';

// Gemini API Configuration
const apiKey = "";

const App = () => {
  const [isOpen, setIsOpen] = useState(true);
  const [activeTab, setActiveTab] = useState('description');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState(null);
  
  // Category Dropdown State
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [categories, setCategories] = useState(['Breakfast', 'Lunch', 'Dinner', 'Dessert', 'Healthy', 'Quick & Easy', 'Vegan']);
  const dropdownRef = useRef(null);

  const [recipe, setRecipe] = useState({
    title: '',
    category: '',
    description: '',
    prepTime: '',
    servings: '',
    ingredients: [{ quantity: '', unit: '', name: '' }],
    instructions: ['']
  });

  const tabs = [
    { id: 'description', label: 'Description' },
    { id: 'ingredients', label: 'Ingredients' },
    { id: 'steps', label: 'Steps' }
  ];

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowCategoryDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // --- Gemini API Integration Logic ---
  
  const callGemini = async (prompt, systemInstruction = "You are a professional chef assistant.") => {
    setIsGenerating(true);
    setError(null);
    
    let retries = 0;
    const maxRetries = 5;
    
    while (retries < maxRetries) {
      try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            systemInstruction: { parts: [{ text: systemInstruction }] },
            generationConfig: { responseMimeType: "application/json" }
          })
        });

        if (!response.ok) throw new Error('API request failed');
        
        const data = await response.json();
        setIsGenerating(false);
        return JSON.parse(data.candidates?.[0]?.content?.parts?.[0]?.text);
      } catch (err) {
        retries++;
        if (retries === maxRetries) {
          setError("AI features are temporarily unavailable. Please try again later.");
          setIsGenerating(false);
          return null;
        }
        await new Promise(res => setTimeout(res, Math.pow(2, retries) * 1000));
      }
    }
  };

  const aiSuggestIngredients = async () => {
    if (!recipe.title) {
      setError("Please enter a recipe title first!");
      return;
    }

    const prompt = `Based on the recipe title "${recipe.title}", suggest a list of 5-8 essential ingredients. Return as JSON: { "ingredients": [{ "quantity": "string", "unit": "string", "name": "string" }] }`;
    const result = await callGemini(prompt, "You are an expert culinary data scientist.");
    
    if (result && result.ingredients) {
      setRecipe(prev => ({
        ...prev,
        ingredients: [...prev.ingredients.filter(i => i.name), ...result.ingredients]
      }));
    }
  };

  const aiRefineSteps = async () => {
    const validSteps = recipe.instructions.filter(s => s.trim().length > 0);
    if (validSteps.length === 0) {
      setError("Add some basic steps first so the AI can refine them!");
      return;
    }

    const prompt = `Take these rough cooking steps and rewrite them to be professional, clear, and easy to follow for a mobile app. 
    Steps: ${JSON.stringify(validSteps)}
    Return as JSON: { "steps": ["refined step 1", "refined step 2"] }`;
    
    const result = await callGemini(prompt, "You are a cookbook editor.");
    
    if (result && result.steps) {
      setRecipe(prev => ({ ...prev, instructions: result.steps }));
    }
  };

  const aiAutoFillDetails = async () => {
    if (!recipe.title) return;
    const prompt = `For a recipe titled "${recipe.title}", estimate the prep time and suggest a short, appetizing description.
    Return as JSON: { "prepTime": "e.g. 45 mins", "description": "string" }`;
    
    const result = await callGemini(prompt);
    if (result) {
      setRecipe(prev => ({
        ...prev,
        prepTime: result.prepTime || prev.prepTime,
        description: result.description || prev.description
      }));
    }
  };

  // --- UI Handlers ---

  const handleSelectCategory = (cat) => {
    setRecipe({ ...recipe, category: cat });
    setShowCategoryDropdown(false);
    // Add to list if it's a new category
    if (!categories.includes(cat)) {
      setCategories([...categories, cat]);
    }
  };

  const filteredCategories = categories.filter(c => 
    c.toLowerCase().includes(recipe.category.toLowerCase())
  );

  const handleAddIngredient = () => {
    setRecipe({ 
      ...recipe, 
      ingredients: [...recipe.ingredients, { quantity: '', unit: '', name: '' }] 
    });
  };

  const handleUpdateIngredient = (index, field, value) => {
    const newIng = [...recipe.ingredients];
    newIng[index][field] = value;
    setRecipe({ ...recipe, ingredients: newIng });
  };

  const handleRemoveIngredient = (index) => {
    const newIng = recipe.ingredients.filter((_, i) => i !== index);
    setRecipe({ ...recipe, ingredients: newIng });
  };

  const handleAddStep = () => {
    setRecipe({ ...recipe, instructions: [...recipe.instructions, ''] });
  };

  const handleUpdateStep = (index, value) => {
    const newSteps = [...recipe.instructions];
    newSteps[index] = value;
    setRecipe({ ...recipe, instructions: newSteps });
  };

  const handleRemoveStep = (index) => {
    const newSteps = recipe.instructions.filter((_, i) => i !== index);
    setRecipe({ ...recipe, instructions: newSteps });
  };

  const handleSubmit = () => {
    setIsSubmitted(true);
  };

  if (!isOpen) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <button 
          onClick={() => {setIsOpen(true); setIsSubmitted(false); setActiveTab('description');}}
          className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-full font-semibold shadow-lg transition-all flex items-center gap-2"
        >
          <Plus size={20} /> Add New Recipe
        </button>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-6 pb-2 flex justify-between items-start bg-white sticky top-0 z-10">
          <div>
            <h2 className="text-2xl font-bold text-slate-800">New Recipe</h2>
            <p className="text-slate-500 text-sm">Create something delicious</p>
          </div>
          <button 
            onClick={() => setIsOpen(false)}
            className="p-2 hover:bg-slate-100 rounded-full transition-colors"
          >
            <X size={24} className="text-slate-400" />
          </button>
        </div>

        {/* Tab Navigation */}
        {!isSubmitted && (
          <div className="flex px-6 border-b bg-white">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 py-4 text-sm font-bold transition-all relative ${
                  activeTab === tab.id ? 'text-orange-500' : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                {tab.label}
                {activeTab === tab.id && (
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-orange-500 rounded-t-full" />
                )}
              </button>
            ))}
          </div>
        )}

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6 relative">
          
          {/* AI Loading State Overlay */}
          {isGenerating && (
            <div className="absolute inset-0 bg-white/70 backdrop-blur-[1px] z-50 flex flex-col items-center justify-center text-orange-500 font-bold">
              <Loader2 className="w-10 h-10 animate-spin mb-2" />
              <span>✨ Gemini is cooking...</span>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-xl flex items-center justify-between border border-red-100">
              <span>{error}</span>
              <button onClick={() => setError(null)}><X size={14} /></button>
            </div>
          )}

          {isSubmitted ? (
            <div className="h-full flex flex-col items-center justify-center text-center space-y-4 animate-in zoom-in-95 duration-500 py-10">
              <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mb-2">
                <CheckCircle2 size={48} className="text-green-500" />
              </div>
              <h2 className="text-2xl font-bold text-slate-800">Recipe Added!</h2>
              <p className="text-slate-500">Your recipe "{recipe.title}" is now available in your collection.</p>
              <button 
                onClick={() => setIsOpen(false)}
                className="bg-slate-900 text-white px-8 py-3 rounded-2xl font-bold hover:bg-slate-800 transition-all"
              >
                Close Modal
              </button>
            </div>
          ) : (
            <>
              {activeTab === 'description' && (
                <div className="space-y-6 animate-in fade-in duration-300">
                  <div className="aspect-video w-full bg-slate-100 rounded-3xl border-2 border-dashed border-slate-300 flex flex-col items-center justify-center gap-2 text-slate-400 cursor-pointer hover:bg-slate-50 transition-colors">
                    <Camera size={32} />
                    <span className="text-sm font-medium">Add Cover Photo</span>
                  </div>

                  <div className="space-y-2 relative">
                    <label className="text-sm font-bold text-slate-700 ml-1">Recipe Title</label>
                    <div className="relative">
                      <input 
                        type="text" 
                        placeholder="e.g. Thai Green Curry"
                        className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-transparent focus:border-orange-500 focus:bg-white focus:outline-none transition-all pr-12"
                        value={recipe.title}
                        onChange={(e) => setRecipe({...recipe, title: e.target.value})}
                      />
                      {recipe.title && (
                        <button 
                          onClick={aiAutoFillDetails}
                          title="Auto-fill details using AI"
                          className="absolute right-2 top-1.5 p-1.5 bg-orange-100 text-orange-600 rounded-lg hover:bg-orange-200 transition-colors"
                        >
                          <Sparkles size={18} />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Category Dropdown Input */}
                  <div className="space-y-2 relative" ref={dropdownRef}>
                    <label className="text-sm font-bold text-slate-700 ml-1 flex items-center gap-1">
                      <Tag size={14} /> Category
                    </label>
                    <div className="relative">
                      <input 
                        type="text" 
                        placeholder="Choose or type a category..."
                        className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-transparent focus:border-orange-500 focus:bg-white focus:outline-none transition-all pr-12"
                        value={recipe.category}
                        onChange={(e) => {
                          setRecipe({...recipe, category: e.target.value});
                          setShowCategoryDropdown(true);
                        }}
                        onFocus={() => setShowCategoryDropdown(true)}
                      />
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                        <ChevronDown size={18} />
                      </div>
                    </div>

                    {showCategoryDropdown && (
                      <div className="absolute left-0 right-0 top-full mt-2 bg-white rounded-2xl shadow-xl border border-slate-100 z-[60] overflow-hidden max-h-48 overflow-y-auto animate-in fade-in slide-in-from-top-2">
                        {filteredCategories.length > 0 ? (
                          filteredCategories.map((cat, i) => (
                            <button
                              key={i}
                              onClick={() => handleSelectCategory(cat)}
                              className="w-full text-left px-5 py-3 text-sm hover:bg-orange-50 hover:text-orange-600 transition-colors border-b border-slate-50 last:border-0"
                            >
                              {cat}
                            </button>
                          ))
                        ) : recipe.category && (
                          <button
                            onClick={() => handleSelectCategory(recipe.category)}
                            className="w-full text-left px-5 py-3 text-sm hover:bg-orange-50 hover:text-orange-600 transition-colors font-medium flex items-center gap-2"
                          >
                            <Plus size={14} /> Create new: "{recipe.category}"
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-slate-700 ml-1 flex items-center gap-1">
                        <Clock size={14} /> Prep Time
                      </label>
                      <input 
                        type="text" 
                        placeholder="30 mins"
                        className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-transparent focus:border-orange-500 focus:bg-white focus:outline-none transition-all"
                        value={recipe.prepTime}
                        onChange={(e) => setRecipe({...recipe, prepTime: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-slate-700 ml-1 flex items-center gap-1">
                        <Users size={14} /> Servings
                      </label>
                      <input 
                        type="number" 
                        placeholder="4"
                        className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-transparent focus:border-orange-500 focus:bg-white focus:outline-none transition-all"
                        value={recipe.servings}
                        onChange={(e) => setRecipe({...recipe, servings: e.target.value})}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 ml-1">Description</label>
                    <textarea 
                      rows="3"
                      placeholder="Tell us about your dish..."
                      className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-transparent focus:border-orange-500 focus:bg-white focus:outline-none transition-all resize-none"
                      value={recipe.description}
                      onChange={(e) => setRecipe({...recipe, description: e.target.value})}
                    ></textarea>
                  </div>
                </div>
              )}

              {activeTab === 'ingredients' && (
                <div className="space-y-4 animate-in fade-in duration-300">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-bold text-slate-800">Ingredients</h3>
                    <button 
                      onClick={aiSuggestIngredients}
                      className="text-xs bg-orange-50 text-orange-600 px-3 py-1.5 rounded-full font-bold flex items-center gap-1 hover:bg-orange-100 transition-all"
                    >
                      <Sparkles size={12} /> Suggest ✨
                    </button>
                  </div>
                  
                  <div className="space-y-3">
                    {recipe.ingredients.map((ing, idx) => (
                      <div key={idx} className="flex gap-2 items-start group">
                        <input 
                          type="text"
                          placeholder="Qty"
                          className="w-16 px-3 py-3 rounded-2xl bg-slate-50 border border-transparent focus:border-orange-500 focus:bg-white focus:outline-none transition-all text-center"
                          value={ing.quantity}
                          onChange={(e) => handleUpdateIngredient(idx, 'quantity', e.target.value)}
                        />
                        <input 
                          type="text"
                          placeholder="Unit"
                          className="w-20 px-3 py-3 rounded-2xl bg-slate-50 border border-transparent focus:border-orange-500 focus:bg-white focus:outline-none transition-all"
                          value={ing.unit}
                          onChange={(e) => handleUpdateIngredient(idx, 'unit', e.target.value)}
                        />
                        <div className="flex-1">
                          <input 
                            type="text"
                            placeholder="Ingredient"
                            className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-transparent focus:border-orange-500 focus:bg-white focus:outline-none transition-all"
                            value={ing.name}
                            onChange={(e) => handleUpdateIngredient(idx, 'name', e.target.value)}
                          />
                        </div>
                        {recipe.ingredients.length > 1 && (
                          <button 
                            onClick={() => handleRemoveIngredient(idx)}
                            className="p-2 text-slate-300 hover:text-red-500 transition-colors mt-1"
                          >
                            <Trash2 size={20} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>

                  <button 
                    onClick={handleAddIngredient}
                    className="w-full py-3 border-2 border-dashed border-slate-200 rounded-2xl text-slate-500 hover:bg-slate-50 hover:border-slate-300 transition-all font-medium flex items-center justify-center gap-2"
                  >
                    <Plus size={18} /> Add Row
                  </button>
                </div>
              )}

              {activeTab === 'steps' && (
                <div className="space-y-4 animate-in fade-in duration-300">
                   <div className="flex items-center justify-between">
                    <h3 className="text-lg font-bold text-slate-800">Cooking Steps</h3>
                    <button 
                      onClick={aiRefineSteps}
                      className="text-xs bg-orange-50 text-orange-600 px-3 py-1.5 rounded-full font-bold flex items-center gap-1 hover:bg-orange-100 transition-all"
                    >
                      <Wand2 size={12} /> Refine ✨
                    </button>
                  </div>

                  <div className="space-y-6">
                    {recipe.instructions.map((inst, idx) => (
                      <div key={idx} className="relative pl-8 pb-2">
                        <div className="absolute left-0 top-3 w-6 h-6 rounded-full bg-orange-100 text-orange-600 text-xs font-bold flex items-center justify-center">
                          {idx + 1}
                        </div>
                        <div className="flex gap-2">
                          <textarea 
                            rows="2"
                            placeholder="Describe this step..."
                            className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-transparent focus:border-orange-500 focus:bg-white focus:outline-none transition-all resize-none"
                            value={inst}
                            onChange={(e) => handleUpdateStep(idx, e.target.value)}
                          ></textarea>
                          {recipe.instructions.length > 1 && (
                            <button 
                              onClick={() => handleRemoveStep(idx)}
                              className="p-2 text-slate-300 hover:text-red-500 transition-colors h-fit mt-2"
                            >
                              <Trash2 size={20} />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  <button 
                    onClick={handleAddStep}
                    className="w-full py-3 border-2 border-dashed border-slate-200 rounded-2xl text-slate-500 hover:bg-slate-50 hover:border-slate-300 transition-all font-medium flex items-center justify-center gap-2"
                  >
                    <Plus size={18} /> Add Step
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer Actions */}
        {!isSubmitted && (
          <div className="p-6 border-t bg-slate-50 sticky bottom-0">
            <button 
              onClick={handleSubmit}
              className="w-full py-4 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-2xl shadow-lg shadow-orange-200 transition-all flex items-center justify-center gap-2"
            >
              <Save size={18} />
              Save Recipe
            </button>
          </div>
        )}

      </div>
    </div>
  );
};

export default App;