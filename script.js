// Wait for the DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
    // Get the button element
    const colorButton = document.getElementById('changeColorBtn');
    
    // Add click event listener to the button
    colorButton.addEventListener('click', function() {
        // Toggle dark mode class on the body
        document.body.classList.toggle('dark-mode');
        
        // Change button text based on current mode
        if (document.body.classList.contains('dark-mode')) {
            colorButton.textContent = 'Switch to Light Mode';
        } else {
            colorButton.textContent = 'Switch to Dark Mode';
        }
    });
    
    // Add animation to cards when they come into view
    const cards = document.querySelectorAll('.card');
    
    // Create an intersection observer
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            // Add a class when the card is visible
            if (entry.isIntersecting) {
                entry.target.style.opacity = 1;
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, { threshold: 0.1 });
    
    // Observe each card
    cards.forEach(card => {
        // Set initial styles
        card.style.opacity = 0;
        card.style.transform = 'translateY(20px)';
        card.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
        
        // Start observing
        observer.observe(card);
    });
    
    // Current year for footer copyright
    const yearSpan = document.querySelector('footer p');
    const currentYear = new Date().getFullYear();
    yearSpan.innerHTML = yearSpan.innerHTML.replace('2023', currentYear);
});