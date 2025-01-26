document.addEventListener('DOMContentLoaded', function() {
    // Get DOM elements
    const pizzasInput = document.getElementById('pizzas');
    const sizeSelect = document.getElementById('size');
    const styleButtons = document.querySelectorAll('.style-btn');
    const hydrationRange = document.getElementById('hydration');
    const hydrationValue = hydrationRange.nextElementSibling;
    const decreaseBtn = document.querySelector('.decrease');
    const increaseBtn = document.querySelector('.increase');
    const unitToggle = document.getElementById('unitToggle');

    // Updated baseRecipes with cooking instructions
    const baseRecipes = {
        neapolitan: {
            flour: 250, // grams, 00 flour
            hydration: {
                min: 55,
                max: 60,
                default: 58  // Correct per Associazione Verace Pizza Napoletana
            },
            saltPercentage: 2.5, // 2.5-3% is traditional
            yeastPercentage: 0.2, // 0.1-0.3% fresh yeast
            description: "00 Flour",
            cooking: {
                temp: {
                    celsius: 450, // 430-480°C
                    fahrenheit: 850 // 800-900°F
                },
                time: "60-90 seconds",
                instructions: "Cook in a very hot wood-fired or high-temperature oven. The pizza should cook quickly, with slightly charred bubbles on the crust."
            }
        },
        ny: {
            flour: 280, // grams, high-protein bread flour
            hydration: {
                min: 58,  // Updated: NY style is typically drier than previously set
                max: 63,
                default: 60  // Changed from 63 to 60
            },
            saltPercentage: 2, // Updated from 2.5 to 2
            yeastPercentage: 0.3, // Updated from 0.4 to 0.3
            description: "High-Protein Bread Flour",  // Updated description
            cooking: {
                temp: {
                    celsius: 290, // Updated from 280
                    fahrenheit: 550 // Updated from 540
                },
                time: "12-15 minutes",
                instructions: "Cook on a pizza stone or steel. The bottom should be crispy and the top should have light brown spots."
            }
        },
        thin: {
            flour: 250, // Updated from 200 to standard base weight
            hydration: {
                min: 50,  // Updated for crispier crust
                max: 60,
                default: 55  // Updated from 60 to 55
            },
            saltPercentage: 1.8, // Updated from 2
            yeastPercentage: 0.4, // Updated from 0.5
            description: "All-Purpose Flour",
            cooking: {
                temp: {
                    celsius: 250, // Updated from 230
                    fahrenheit: 480 // Updated from 450
                },
                time: "8-10 minutes",  // Updated from 10-12
                instructions: "Cook on a preheated pizza stone or baking sheet until the crust is golden and crispy."
            }
        },
        thick: {
            flour: 300,
            hydration: {
                min: 65,
                max: 72, // Updated from 75 (too wet for thick crust)
                default: 68 // Updated from 70
            },
            saltPercentage: 1.8, // Updated from 2
            yeastPercentage: 0.4, // Updated from 0.5
            description: "Bread Flour",
            cooking: {
                temp: {
                    celsius: 220, // Updated from 200
                    fahrenheit: 425 // Updated from 400
                },
                time: "18-20 minutes", // Updated from 20-25
                instructions: "Cook in a well-oiled pan. The bottom should be golden and crispy, while the interior should be light and airy."
            }
        }
    };

    // Size multipliers (based on area ratio compared to 12")
    const sizeMultipliers = {
        "10": 0.69, // (10^2)/(12^2)
        "12": 1,
        "14": 1.36,
        "16": 1.78
    };

    // Conversion functions
    function gramsToOunces(grams) {
        return Math.round(grams * 0.035274 * 10) / 10;
    }

    function ouncesToGrams(ounces) {
        return Math.round(ounces * 28.3495);
    }

    function celsiusToFahrenheit(celsius) {
        return Math.round(celsius * 9/5 + 32);
    }

    // Update hydration range based on style
    function updateHydrationRange() {
        const style = getSelectedStyle();
        const recipe = baseRecipes[style];
        
        hydrationRange.min = recipe.hydration.min;
        hydrationRange.max = recipe.hydration.max;
        hydrationRange.value = recipe.hydration.default;
        hydrationValue.textContent = recipe.hydration.default + '%';
    }

    // Update flour description based on style
    function updateFlourDescription() {
        const style = getSelectedStyle();
        const flourDesc = baseRecipes[style].description;
        document.querySelector('.ingredient-name').textContent = `Flour (${flourDesc})`;
    }

    // New function to update cooking instructions
    function updateCookingInstructions() {
        const style = getSelectedStyle();
        const recipe = baseRecipes[style];
        const cooking = recipe.cooking;
        const isImperial = unitToggle.checked;

        const tempElement = document.getElementById('cooking-temp');
        if (isImperial) {
            tempElement.textContent = `${cooking.temp.fahrenheit}°F`;
        } else {
            tempElement.textContent = `${cooking.temp.celsius}°C`;
        }
        
        document.getElementById('cooking-time').textContent = cooking.time;
        document.getElementById('cooking-instructions').textContent = cooking.instructions;
    }

    // Update event listeners
    styleButtons.forEach(button => {
        button.addEventListener('click', function() {
            // Remove active class from all buttons
            styleButtons.forEach(btn => btn.classList.remove('active'));
            // Add active class to clicked button
            this.classList.add('active');
            
            // Trigger recipe card animation
            const recipeCard = document.querySelector('.results-card');
            recipeCard.classList.remove('recipe-update'); // Remove class if it exists
            // Force reflow
            void recipeCard.offsetWidth;
            // Add animation class
            recipeCard.classList.add('recipe-update');
            
            // Update calculations with the new style
            const selectedStyle = this.dataset.style;
            updateHydrationRange();
            updateFlourDescription();
            updateCookingInstructions();
            calculateDough();
        });
    });

    hydrationRange.addEventListener('input', function() {
        hydrationValue.textContent = this.value + '%';
        calculateDough();
    });

    sizeSelect.addEventListener('change', calculateDough);
    pizzasInput.addEventListener('input', calculateDough);

    decreaseBtn.addEventListener('click', function() {
        if (pizzasInput.value > 1) {
            pizzasInput.value = parseInt(pizzasInput.value) - 1;
            calculateDough();
        }
    });

    increaseBtn.addEventListener('click', function() {
        if (pizzasInput.value < 10) {
            pizzasInput.value = parseInt(pizzasInput.value) + 1;
            calculateDough();
        }
    });

    // Calculate dough ingredients
    function calculateDough() {
        const style = getSelectedStyle();
        const recipe = baseRecipes[style];
        const numberOfPizzas = parseInt(pizzasInput.value);
        const sizeMultiplier = sizeMultipliers[sizeSelect.value];
        const hydrationPercentage = parseInt(hydrationRange.value);

        // Base flour calculation
        const flour = Math.round(recipe.flour * numberOfPizzas * sizeMultiplier);
        
        // Calculate other ingredients
        const water = Math.round(flour * (hydrationPercentage / 100));
        const salt = Math.round(flour * (recipe.saltPercentage / 100));
        const yeast = Math.round(flour * (recipe.yeastPercentage / 100));

        // Update the UI
        updateIngredientAmount('Flour', flour);
        updateIngredientAmount('Water', water);
        updateIngredientAmount('Salt', salt);
        updateIngredientAmount('Yeast', yeast);
    }

    function updateIngredientAmount(ingredientBaseName, amount) {
        const ingredients = document.querySelectorAll('.ingredient');
        const isImperial = unitToggle.checked;
        
        for (let ingredient of ingredients) {
            const nameElement = ingredient.querySelector('.ingredient-name');
            const amountElement = ingredient.querySelector('.ingredient-amount');
            
            if (nameElement.textContent.includes(ingredientBaseName)) {
                if (isImperial) {
                    const ounces = gramsToOunces(amount);
                    amountElement.textContent = `${ounces}oz`;
                } else {
                    amountElement.textContent = `${amount}g`;
                }
            }
        }
    }

    // Update initialization
    updateHydrationRange();
    updateFlourDescription();
    updateCookingInstructions();
    calculateDough();

    // Helper function to get selected style
    function getSelectedStyle() {
        return document.querySelector('.style-btn.active').dataset.style;
    }

    // Update the unit toggle event listener to include size unit update
    unitToggle.addEventListener('change', function() {
        // Trigger recipe card animation
        const recipeCard = document.querySelector('.results-card');
        recipeCard.classList.remove('recipe-update');
        void recipeCard.offsetWidth;
        recipeCard.classList.add('recipe-update');
        
        // Update all measurements
        updateSizeUnit();
        calculateDough();
        updateCookingInstructions();
    });

    // Update the updateSizeUnit function
    function updateSizeUnit() {
        const sizeUnit = document.getElementById('size-unit');
        const sizeSelect = document.getElementById('size');
        const isImperial = unitToggle.checked;
        
        // Update the unit text in the label
        sizeUnit.textContent = isImperial ? '(inches)' : '(cm)';
        
        // Update the size options text
        const sizeOptions = {
            "10": { inch: '10"', cm: '25cm' },
            "12": { inch: '12"', cm: '30cm' },
            "14": { inch: '14"', cm: '35cm' },
            "16": { inch: '16"', cm: '40cm' }
        };
        
        // Update each option's text based on the selected unit system
        Array.from(sizeSelect.options).forEach(option => {
            const size = option.value;
            option.textContent = isImperial 
                ? sizeOptions[size].inch
                : sizeOptions[size].cm;
        });
    }

    // Add updateSizeUnit to initial setup
    updateSizeUnit();
}); 