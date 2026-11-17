export default {
  content: ['./client/index.html', './client/src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#15251c',
        brand: { 50:'#f2f7f3', 100:'#e2efe4', 200:'#c4dfca', 300:'#9dc9a8', 400:'#70ae80', 500:'#4a9360', 600:'#32764a', 700:'#285f3c', 800:'#214c32', 900:'#1b3f2b', 950:'#102519' },
        gold: { 50:'#fff9ec',100:'#fff0cc',200:'#ffdf99',300:'#ffca66',400:'#ffb336',500:'#f39b18',600:'#d77b0b',700:'#b15a0d' },
      },
      fontFamily:{sans:['Inter','ui-sans-serif','system-ui','sans-serif'],display:['Inter','ui-sans-serif','system-ui','sans-serif']},
      boxShadow:{soft:'0 10px 40px rgba(16,37,25,.08)',lift:'0 24px 72px rgba(16,37,25,.15)'},
      keyframes:{'float-in':{'0%':{opacity:'0',transform:'translateY(12px)'},'100%':{opacity:'1',transform:'translateY(0)'}}},
      animation:{'float-in':'float-in .55s ease-out both'},
    },
  },
  plugins:[],
};
