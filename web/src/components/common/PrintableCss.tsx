export function PrintableCss() {
  return (
    <div>
      <style>
        {`
        body {
          font-family: Arial;
          font-size: 11px;
        }
        .container {
          width: 100%;
          max-width: 1000px;
          margin: auto;
          display: flex;
          flex-direction: column;
          gap: 12px;

        }
      .flex {
        display: flex;
      
      }
      .items-center {
        align-items: center;
      }
      .justify-between {
        justify-content: space-between;
      }

      table {
        width: 100%;
        border-collapse: collapse;
        font-size: 11px;
      }
      td, th {
        padding: 7px 15px;
        border: 1px solid black;
        text-align: left;

      }

      .header {
        
      }
      .patientNo {
        font-size: 25px;
        font-weight: 900;
        font-style: italic;
      }
      .totalCost {
        text-align: right;
      }
      .totalCost div {
        display: inline-block;
        padding: 15px 20px;
        background: #eee;
        font-size: 15px;
        font-weight: 800;
      }

      .footer {
          justify-content: space-between;
      }

      .line-through {
      text-decoration: line-through;
      }

      .w-4 {
      width: 15px
      }
    `}
      </style>
    </div>
  );
}

export default PrintableCss;
