#!/usr/bin/perl -w
use strict;
use JSON;

@ARGV = ('April_23_2013_Special_Election_Unofficial_Results.csv') if not @ARGV;
$_ = <>;
chomp;
my %v;
my %ward;
my @columns = map { chomp; s/["\r\n]//g; lc } split /,/;
while (<>) {
    s/\s+$//;
    s/^"//; s/"$//;
    my %r;
    @r{@columns} = split /","/;
    next unless $r{contest_name} =~ /^AT\W*LARGE/
        and $r{candidate} !~ /ER VOTES$/;
    my $key2 = $r{ballot_name} || $r{candidate};
    $key2 =~ s/.* //;
    $key2 = ucfirst lc $key2;
    my $key1 = $r{precinct_number};
    if ($ward{$r{precinct_number}} && $ward{$r{precinct_number}} != $r{ward}) {
        warn "Precinct $r{precinct_number} is Ward $ward{$r{precinct_number}}" .
            " and $r{ward}\n";
    }
    $ward{$r{precinct_number}} = $r{ward};
    $v{$key2}{$key1} = $r{votes} + 0;
}

#for my $candidate (sort keys %v) {
for my $candidate ('Silverman') {
    print "$candidate\n";
    my %v2 = %{$v{$candidate}};
    my $i = 0;
    my $subtotal = 0;
    my $total = 0;
    #for my $pct (sort { $v2{$b} <=> $v2{$a} || $a <=> $b } keys %v2) {
    for my $pct (sort { $a <=> $b } keys %v2) {
        ++$i;
        if ($i <= 200) {
            #printf " %3d. Pct %3d: %4d\n", $i, $pct, $v2{$pct};
            printf "%4d\n", $v2{$pct};
            $subtotal += $v2{$pct};
        }
        $total += $v2{$pct};
    }
    printf "TOTAL %d / %d = %.1f%%\n\n", $subtotal, $total,
        100 * $subtotal / $total;
}
exit;

my %c;
for my $pct (keys %v) {
    my %votes = %{$v{$pct}};
    my @candidates = sort { $votes{$b} <=> $votes{$a} } keys %votes;
    my $total  = 0;
    for my $n (values %votes) {
        $total += $n;
    }
    my $n = 100 * $votes{$candidates[1]} / $total;
    my $frac = $votes{$candidates[1]} / $votes{$candidates[0]};
    $c{$frac > 0.5 ? join(', ', @candidates[0..1]) : $candidates[0]}++;
    if ($n >= 50 and $candidates[0] ne 'Bonds') {
        print "$pct: ", join(', ', @candidates), "\n";
        printf "%s: %.1f%%\n", $pct, $n;
    }
}
use Data::Dumper; print Dumper \%c;
