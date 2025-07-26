/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./Components/**/*.{js,ts,jsx,tsx}",    
  ],
 
  theme: {
extend: {
      keyframes: {
        'custom-animate': {
          '0%': { 
            transform: 'translateY(0) rotate(0deg)',
            opacity: 1,
            borderRadius: '0' 
          },
          '100%': { 
            transform: 'translateY(-1000px) rotate(720deg)',
            opacity: 0,
            borderRadius: '50%' 
          },
        },
      },
      animation: {
        'custom-animate': 'custom-animate 25s linear infinite',
      },
    },
  },
  plugins: [
   
  ],
}
