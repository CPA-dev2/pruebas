import React, { useEffect, useState } from "react";
import ReactApexChart from "react-apexcharts";

const PieChart = (props) => {
  const [chartData, setChartData] = useState([]);
  const [chartOptions, setChartOptions] = useState({});

  useEffect(() => {
    setChartData(props.chartData);
    setChartOptions(props.chartOptions);
  }, [props.chartData, props.chartOptions]);

  return (
    <ReactApexChart
      options={chartOptions}
      series={chartData}
      type='pie'
      width='100%'
      height='55%'
    />
  );
};

export default PieChart;
