const IndexPage = () => {
    return null;
  };
  
  export const getServerSideProps = async (context) => {
    context.res.writeHead(302, { Location: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC8188708/' });
    context.res.end();
    
//or https://pinir.ncl.res.in/ directly
  
    return {props: {}};
  };
  
  export default IndexPage;