// تابع مدیریت افکت هشدار Ultra
document.addEventListener('DOMContentLoaded', function() {
    const warning = document.querySelector('.portfolio-warning-ultra');
    const heading = document.querySelector('.portfolio-warning-heading');
    const icons = warning.querySelectorAll('.warning-icon');

    // افکت Hover روی هشدار
    warning.addEventListener('mouseenter', () => {
        warning.style.transform = 'scale(1.08)';
        warning.style.boxShadow = '0 20px 50px rgba(0,0,0,0.35)';
        icons.forEach(icon => {
            icon.style.transform = 'rotate(15deg) scale(1.2)';
            icon.style.transition = 'transform 0.5s ease';
        });
    });

    warning.addEventListener('mouseleave', () => {
        warning.style.transform = 'scale(1)';
        warning.style.boxShadow = '0 10px 25px rgba(0,0,0,0.2)';
        icons.forEach(icon => {
            icon.style.transform = 'rotate(0deg) scale(1)';
        });
    });

    // افکت Scroll: وقتی هشدار وارد صفحه شد
    function handleScroll() {
        const rect = warning.getBoundingClientRect();
        if(rect.top < window.innerHeight && rect.bottom > 0) {
            warning.classList.add('show-ultra');
            heading.classList.add('show-ultra');
        } else {
            warning.classList.remove('show-ultra');
            heading.classList.remove('show-ultra');
        }
    }

    window.addEventListener('scroll', handleScroll);
    handleScroll(); // بررسی اولیه هنگام لود
});