let expenses = [];
        let totalSalary = 0;
        let pieChart = null;
        let currentCurrency = 'INR';
        let exchangeRates = {};
        let baseCurrencyValue = 1; // Exchange rate from base currency to current currency

        // Initialize exchange rates
        async function initializeExchangeRates() {
            try {
                const response = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
                const data = await response.json();
                exchangeRates = data.rates;
                console.log('Exchange rates loaded:', exchangeRates);
            } catch (error) {
                console.error('Error fetching exchange rates:', error);
                alert('Unable to load exchange rates. Using default USD rates.');
            }
        }

        // Change currency and update all displays
        function changeCurrency() {
            const currencySelect = document.getElementById('currencySelect');
            currentCurrency = currencySelect.value;
            
            // Get exchange rate for selected currency
            if (exchangeRates[currentCurrency]) {
                baseCurrencyValue = exchangeRates[currentCurrency];
            } else {
                baseCurrencyValue = 1;
            }
            
            // Clear salary input and reset salary value
            document.getElementById('salary').value = '';
            totalSalary = 0;
            
            // Update all displays
            updateDisplay();
            
            // Save the new currency selection
            saveData();
        }

        // Format currency value
        function formatCurrency(value) {
            const converted = value * baseCurrencyValue;
            const symbols = {
                'USD': '$',
                'INR': '₹',
                'EUR': '€',
                'GBP': '£',
                'JPY': '¥',
                'AUD': 'A$',
                'CAD': 'C$'
            };
            
            const symbol = symbols[currentCurrency] || currentCurrency;
            return `${symbol}${converted.toFixed(2)}`;
        }

        // Save data to localStorage
        function saveData() {
            const data = {
                salary: totalSalary,
                expenses: expenses,
                currency: currentCurrency
            };
            localStorage.setItem('trackerData', JSON.stringify(data));
        }

        // Load data from localStorage
        function loadData() {
            const savedData = localStorage.getItem('trackerData');
            if (savedData) {
                const data = JSON.parse(savedData);
                totalSalary = data.salary || 0;
                expenses = data.expenses || [];
                
                // Restore currency if saved
                if (data.currency) {
                    currentCurrency = data.currency;
                    document.getElementById('currencySelect').value = currentCurrency;
                    
                    // Update exchange rate for restored currency
                    if (exchangeRates[currentCurrency]) {
                        baseCurrencyValue = exchangeRates[currentCurrency];
                    } else {
                        baseCurrencyValue = 1;
                    }
                }
                
                // Restore salary input
                if (totalSalary > 0) {
                    document.getElementById('salary').value = totalSalary;
                }
                
                // Display loaded data
                renderExpenses();
                updateSalaryDisplay();
                updateSummary();
            }
        }

        function validateExpense(name, amount) {
            name = name.trim();
            amount = parseFloat(amount);
            
            if (!name) {
                return { valid: false, message: 'Please enter an expense name' };
            }
            
            if (isNaN(amount)) {
                return { valid: false, message: 'Please enter a valid amount' };
            }
            
            if (amount <= 0) {
                return { valid: false, message: 'Amount must be greater than 0' };
            }
            
            return { valid: true, message: '' };
        }

        // Unified function to update all displays
        function updateDisplay() {
            renderExpenses();
            updateSummary();
            updateChart();
        }

        function updateSalary() {
            const salaryInput = document.getElementById('salary');
            totalSalary = parseFloat(salaryInput.value) || 0;
            
            updateDisplay();
            saveData();
        }

        function addExpense() {
            const nameInput = document.getElementById('expenseName');
            const amountInput = document.getElementById('expenseAmount');
            
            const name = nameInput.value.trim();
            const amount = amountInput.value;
            
            const validation = validateExpense(name, amount);
            
            if (!validation.valid) {
                alert(validation.message);
                return;
            }
            
            const expense = {
                id: Date.now(),
                name: name,
                amount: parseFloat(amount)
            };
            
            expenses.push(expense);
            nameInput.value = '';
            amountInput.value = '';
            
            updateDisplay();
            saveData();
        }

        function deleteExpense(id) {
            expenses = expenses.filter(expense => expense.id !== id);
            updateDisplay();
            saveData();
        }

        function renderExpenses() {
            const expenseList = document.getElementById('expenseList');
            expenseList.innerHTML = '';
            
            expenses.forEach(expense => {
                const li = document.createElement('li');
                li.className = 'expense-item';
                li.innerHTML = `
                    <div>
                        <strong>${expense.name}</strong>: ${formatCurrency(expense.amount)}
                    </div>
                    <button class="delete-btn" onclick="deleteExpense(${expense.id})">Delete</button>
                `;
                expenseList.appendChild(li);
            });
        }

        function updateSummary() {
            const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);
            const remainingBalance = totalSalary - totalExpenses;
            const tenPercentOfSalary = totalSalary * 0.1;
            
            // Check if remaining balance is 10% or less of salary
            const isLowBalance = totalSalary > 0 && remainingBalance <= tenPercentOfSalary && remainingBalance >= 0;
            const isNegativeBalance = remainingBalance < 0;
            
            // Determine balance color
            let balanceColor = 'green';
            if (isNegativeBalance) {
                balanceColor = 'red';
            } else if (isLowBalance) {
                balanceColor = 'red';
            }
            
            // Show warning alert if balance is low (but not negative)
            if (isLowBalance) {
                const warningMessage = `⚠️ WARNING: Your remaining balance is only ${(remainingBalance / totalSalary * 100).toFixed(1)}% of your salary! Be careful with your spending.`;
                console.warn(warningMessage);
                // Show alert only once per update if balance changed
                if (!window.lastLowBalanceAlertShown || Math.abs(remainingBalance - (window.lastRemainingBalance || 0)) > 0.1) {
                    alert(warningMessage);
                    window.lastLowBalanceAlertShown = true;
                }
            } else {
                window.lastLowBalanceAlertShown = false;
            }
            
            window.lastRemainingBalance = remainingBalance;
            
            // Update salary display
            const salaryDisplay = document.getElementById('salaryDisplay');
            if (totalSalary > 0) {
                salaryDisplay.textContent = `Total Salary: ${formatCurrency(totalSalary)}`;
                salaryDisplay.style.display = 'block';
            } else {
                salaryDisplay.style.display = 'none';
            }
            
            // Update summary display
            const summary = document.getElementById('summary');
            summary.innerHTML = `
                <div class="summary">
                    <div>Total Salary: ${formatCurrency(totalSalary)}</div>
                    <div>Total Expenses: ${formatCurrency(totalExpenses)}</div>
                    <div style="color: ${balanceColor}; font-size: 20px; margin-top: 10px;">
                        Remaining Balance: ${formatCurrency(remainingBalance)}
                        ${isLowBalance ? ' ⚠️ LOW' : ''}
                    </div>
                </div>
            `;
        }

        // Initialize on page load
        window.addEventListener('DOMContentLoaded', function() {
            initializeExchangeRates();
            loadData();
            updateChart();
        });

        // Download report as PDF
        function downloadReport() {
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF();
            const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);
            const remainingBalance = totalSalary - totalExpenses;
            
            let yPosition = 20;
            
            // Title
            doc.setFontSize(20);
            doc.text('Salary & Expense Tracker Report', 20, yPosition);
            yPosition += 15;
            
            // Date
            doc.setFontSize(10);
            doc.text(`Generated: ${new Date().toLocaleString()}`, 20, yPosition);
            yPosition += 10;
            
            // Summary Section
            doc.setFontSize(14);
            doc.text('Summary', 20, yPosition);
            yPosition += 10;
            
            doc.setFontSize(11);
            doc.text(`Total Salary: $${totalSalary.toFixed(2)}`, 30, yPosition);
            yPosition += 7;
            doc.text(`Total Expenses: $${totalExpenses.toFixed(2)}`, 30, yPosition);
            yPosition += 7;
            
            // Highlight remaining balance
            const balanceColor = remainingBalance >= 0 ? [76, 175, 80] : [255, 99, 132];
            doc.setTextColor(...balanceColor);
            doc.setFontSize(12);
            doc.text(`Remaining Balance: $${remainingBalance.toFixed(2)}`, 30, yPosition);
            doc.setTextColor(0, 0, 0);
            yPosition += 15;
            
            // Expenses Section
            if (expenses.length > 0) {
                doc.setFontSize(14);
                doc.text('Expense Details', 20, yPosition);
                yPosition += 10;
                
                doc.setFontSize(10);
                expenses.forEach(expense => {
                    doc.text(`• ${expense.name}: $${expense.amount.toFixed(2)}`, 30, yPosition);
                    yPosition += 6;
                    
                    // Add new page if needed
                    if (yPosition > 250) {
                        doc.addPage();
                        yPosition = 20;
                    }
                });
                yPosition += 5;
            }
            
            // Add chart image
            try {
                html2canvas(document.getElementById('chartCanvas')).then(canvas => {
                    const chartImage = canvas.toDataURL('image/png');
                    const chartWidth = 150;
                    const chartHeight = 120;
                    
                    doc.setFontSize(14);
                    doc.text('Balance vs Expenses Chart', 20, yPosition);
                    yPosition += 10;
                    
                    // Center the chart
                    const centerX = (doc.internal.pageSize.getWidth() - chartWidth) / 2;
                    doc.addImage(chartImage, 'PNG', centerX, yPosition, chartWidth, chartHeight);
                    
                    // Save the PDF
                    doc.save('Expense_Report.pdf');
                });
            } catch (error) {
                console.error('Error generating PDF:', error);
                alert('Error generating PDF. Please try again.');
            }
        }

        // Create and update pie chart
        function updateChart() {
            const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);
            const remainingBalance = totalSalary - totalExpenses;
            
            const ctx = document.getElementById('chartCanvas').getContext('2d');
            
            if (pieChart) {
                pieChart.destroy();
            }
            
            pieChart = new Chart(ctx, {
                type: 'pie',
                data: {
                    labels: ['Remaining Balance', 'Total Expenses'],
                    datasets: [{
                        data: [remainingBalance > 0 ? remainingBalance * baseCurrencyValue : 0, totalExpenses * baseCurrencyValue],
                        backgroundColor: [
                            '#4CAF50',
                            '#FF6384'
                        ],
                        borderColor: [
                            '#45a049',
                            '#FF5373'
                        ],
                        borderWidth: 2
                    }]
                },
                options: {
                    responsive: true,
                    plugins: {
                        legend: {
                            position: 'bottom',
                            labels: {
                                padding: 15,
                                font: {
                                    size: 14
                                }
                            }
                        },
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    const label = context.label || '';
                                    const value = formatCurrency(context.parsed / baseCurrencyValue);
                                    return label + ': ' + value;
                                }
                            }
                        }
                    }
                }
            });
        }