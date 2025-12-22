import React, { useEffect, useState } from "react";
import Chart from "react-apexcharts";

const BarChart = (props) => {
  const [chartData, setChartData] = useState([]);
  const [chartOptions, setChartOptions] = useState({});

  useEffect(() => {
    setChartData(props.chartData);
    setChartOptions(props.chartOptions);
  }, [props.chartData, props.chartOptions]);

  return (
    <Chart
      options={chartOptions}
      series={chartData}
      type='bar'
      width='100%'
      height='100%'
    />
  );
};

export default BarChart;
