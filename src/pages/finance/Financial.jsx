import React from "react";

const Financial = () => {
  return (
    <div className="panel active">
      <div className="panel-head">
        <div>
          <h2> Financial</h2>
          <div className="desc">Income & expense</div>
        </div>
        <button className="btn btn-primary">+ Add Transaction</button>
      </div>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Type</th>
              <th>Category</th>
              <th>Amount</th>
              <th>Notes</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td colSpan="6" className="empty">
                No transactions yet
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Financial;
